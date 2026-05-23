package highlight

import (
	"context"
	"encoding/json"
	"errors"

	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"
	"github.com/storganizer/server/internal/wled"

	"github.com/coder/websocket"
	"github.com/pocketbase/pocketbase/core"
)

// frameMessage is the only JSON shape the hover-stream WS accepts.
// The frontend publishes its intended LED frame; the backend tracks the
// previous frame for this connection and forwards the delta as WARLS UDP.
//
//	{"type":"frame","leds":[{"idx":3,"r":255,"g":0,"b":0}]}
//	{"type":"frame","leds":[]}   // clear
type frameMessage struct {
	Type string     `json:"type"`
	LEDs []frameLED `json:"leds"`
}

type frameLED struct {
	Idx int   `json:"idx"`
	R   uint8 `json:"r"`
	G   uint8 `json:"g"`
	B   uint8 `json:"b"`
}

// handleHoverStream upgrades the request to WebSocket and forwards the
// frontend's intended LED frame to WLED as WARLS UDP packets. The connection
// is per-tab; when it closes (or the frontend stops sending), WLED's realtime
// timeout auto-restores its previous effect ~1s later.
func handleHoverStream(e *core.RequestEvent) error {
	deviceID := e.Request.PathValue("id")
	device, err := e.App.FindRecordById(deviceconsts.Collection, deviceID)
	if err != nil {
		return e.NotFoundError("device not found", err)
	}
	deviceURL := device.GetString(deviceconsts.FieldURL)

	conn, err := websocket.Accept(e.Response, e.Request, &websocket.AcceptOptions{
		// Browser dev servers run on a different origin than the backend.
		// We're inside the local network, so this is acceptable.
		InsecureSkipVerify: true,
	})
	if err != nil {
		return err
	}
	defer conn.Close(websocket.StatusInternalError, "closing")

	// Track which LEDs we lit in the previous frame so we can extinguish
	// any that aren't in the next frame.
	previouslyLit := make(map[int]bool)

	ctx := e.Request.Context()
	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			// Silence the strip on disconnect; WLED will then auto-restore
			// after its realtime timeout.
			if len(previouslyLit) > 0 {
				offFrame := make([]wled.LEDColor, 0, len(previouslyLit))
				for idx := range previouslyLit {
					offFrame = append(offFrame, wled.LEDColor{Index: idx})
				}
				_ = wled.SendWARLS(deviceURL, offFrame)
			}
			if errors.Is(err, context.Canceled) ||
				websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
				websocket.CloseStatus(err) == websocket.StatusGoingAway {
				return nil
			}
			return nil
		}

		var msg frameMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}
		if msg.Type != "frame" {
			continue
		}

		// Build the WARLS packet: every LED in the new frame, plus
		// (0,0,0) for LEDs that were lit before but aren't anymore.
		nextLit := make(map[int]bool, len(msg.LEDs))
		leds := make([]wled.LEDColor, 0, len(msg.LEDs)+len(previouslyLit))
		for _, l := range msg.LEDs {
			leds = append(leds, wled.LEDColor{Index: l.Idx, R: l.R, G: l.G, B: l.B})
			nextLit[l.Idx] = true
		}
		for idx := range previouslyLit {
			if !nextLit[idx] {
				leds = append(leds, wled.LEDColor{Index: idx})
			}
		}
		_ = wled.SendWARLS(deviceURL, leds)
		previouslyLit = nextLit
	}
}
