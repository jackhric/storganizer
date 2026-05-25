package warls

import (
	"context"
	"sync"
	"time"

	"github.com/storganizer/server/internal/wled"
)

// WLED's WARLS realtime timeout is ~1s. We re-send every 300ms so a single
// dropped UDP packet or scheduler jitter can't cause the strip to drop back
// to its previous effect.
const warlsKeepaliveInterval = 300 * time.Millisecond

// LED carries the desired color for a single LED index.
type LED struct {
	Idx int
	R   uint8
	G   uint8
	B   uint8
}

// deviceState owns the current frame for one WLED device and the goroutine
// that keeps that frame on the strip via repeated WARLS packets.
//
// A device is "active" while it has any lit LEDs. When the frame becomes
// empty the goroutine sends one final all-off packet (so previously-lit
// LEDs go dark immediately rather than waiting for WLED's realtime timeout)
// and exits. The next non-empty Set restarts a new goroutine.
type deviceState struct {
	url    string
	frame  map[int]LED
	cancel context.CancelFunc
}

// Registry is the process-wide owner of WARLS streaming state. It maps a
// device URL to the LEDs that should be lit on it, and runs a keepalive
// goroutine per active device.
//
// All public methods are safe for concurrent use.
type Registry struct {
	mu      sync.Mutex
	devices map[string]*deviceState
}

func NewRegistry() *Registry {
	return &Registry{devices: make(map[string]*deviceState)}
}

// Set replaces the frame for the given device URL. An empty `leds` slice is
// equivalent to Clear(url).
//
// The new frame is sent to WLED immediately so the strip repaints within one
// UDP round-trip; the per-device goroutine continues re-sending it at the
// keepalive cadence so it persists across WLED's realtime timeout.
//
// Any LED that was lit in the previous frame but isn't in the new frame is
// explicitly extinguished — WARLS only updates the indices in its packet, so
// without the diff a "moved" highlight would leave a trail of stuck LEDs.
func (r *Registry) Set(url string, leds []LED) {
	if len(leds) == 0 {
		r.Clear(url)
		return
	}

	next := framesToMap(leds)

	r.mu.Lock()
	state, ok := r.devices[url]
	if !ok {
		state = &deviceState{url: url}
		r.devices[url] = state
		ctx, cancel := context.WithCancel(context.Background())
		state.cancel = cancel
		go r.run(ctx, state)
	}
	prev := state.frame
	state.frame = next
	r.mu.Unlock()

	packet := make([]wled.LEDColor, 0, len(next)+len(prev))
	for _, l := range next {
		packet = append(packet, wled.LEDColor{Index: l.Idx, R: l.R, G: l.G, B: l.B})
	}
	for idx := range prev {
		if _, kept := next[idx]; !kept {
			packet = append(packet, wled.LEDColor{Index: idx})
		}
	}
	_ = wled.SendWARLS(url, packet)
}

// Clear stops streaming to the given device URL and turns off any LEDs that
// were lit. Safe to call for a URL that isn't currently active.
func (r *Registry) Clear(url string) {
	r.mu.Lock()
	state, ok := r.devices[url]
	if !ok {
		r.mu.Unlock()
		return
	}
	delete(r.devices, url)
	r.mu.Unlock()

	state.cancel()
	// Send an explicit off-packet for the LEDs we had lit so the strip
	// doesn't visibly hold the highlight while WLED's realtime timer ticks
	// down.
	if len(state.frame) > 0 {
		_ = wled.SendWARLS(url, allOffPacket(state.frame))
	}
}

func (r *Registry) snapshot(url string) []LED {
	r.mu.Lock()
	defer r.mu.Unlock()
	state, ok := r.devices[url]
	if !ok {
		return nil
	}
	leds := make([]LED, 0, len(state.frame))
	for _, l := range state.frame {
		leds = append(leds, l)
	}
	return leds
}

// run is the keepalive goroutine for one device. It re-sends the current
// frame at warlsKeepaliveInterval until cancelled. The first paint happens
// synchronously in Set; this loop only exists to outlast WLED's realtime
// timeout while the frame is held.
func (r *Registry) run(ctx context.Context, state *deviceState) {
	t := time.NewTicker(warlsKeepaliveInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			r.sendOnce(state.url)
		}
	}
}

func (r *Registry) sendOnce(url string) {
	leds := r.snapshot(url)
	if len(leds) == 0 {
		return
	}
	packet := make([]wled.LEDColor, 0, len(leds))
	for _, l := range leds {
		packet = append(packet, wled.LEDColor{Index: l.Idx, R: l.R, G: l.G, B: l.B})
	}
	_ = wled.SendWARLS(url, packet)
}

func framesToMap(leds []LED) map[int]LED {
	m := make(map[int]LED, len(leds))
	for _, l := range leds {
		m[l.Idx] = l
	}
	return m
}

func allOffPacket(frame map[int]LED) []wled.LEDColor {
	out := make([]wled.LEDColor, 0, len(frame))
	for idx := range frame {
		out = append(out, wled.LEDColor{Index: idx})
	}
	return out
}
