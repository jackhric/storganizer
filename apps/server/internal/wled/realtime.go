// WARLS (Warlight Addressable Realtime LED Streaming) over UDP.
// Reference: https://kno.wled.ge/interfaces/udp-realtime/
//
// Packet format:
//   byte 0       — protocol (0x01 = WARLS, 1-byte indices)
//   byte 1       — timeout in seconds (255 = WLED default ~2.5s)
//   bytes 2..N   — repeating [index, r, g, b] tuples
//
// While realtime packets arrive, WLED suspends its current effect and pipes
// the incoming colors straight to the strip. When packets stop, it auto-
// restores after the timeout — no explicit "release" RPC needed.
package wled

import (
	"fmt"
	"net"
	"net/url"
)

const (
	warlsPort      = 21324
	warlsProtocol  = 0x01
	warlsTimeoutDefault = 1 // seconds — short so the strip restores quickly when we go silent
)

// SendWARLS sends a WARLS packet to the device's realtime UDP port. The device
// URL is the same one stored on the devices record (e.g. http://wled-wled).
// LED indices > 255 are silently skipped — WARLS uses 1-byte indices.
func SendWARLS(deviceURL string, leds []LEDColor) error {
	host, err := hostFromURL(deviceURL)
	if err != nil {
		return err
	}

	addr, err := net.ResolveUDPAddr("udp4", fmt.Sprintf("%s:%d", host, warlsPort))
	if err != nil {
		return fmt.Errorf("resolve %s: %w", host, err)
	}

	conn, err := net.DialUDP("udp4", nil, addr)
	if err != nil {
		return fmt.Errorf("dial udp %s: %w", addr, err)
	}
	defer conn.Close()

	packet := make([]byte, 0, 2+4*len(leds))
	packet = append(packet, warlsProtocol, warlsTimeoutDefault)
	for _, led := range leds {
		if led.Index < 0 || led.Index > 255 {
			continue
		}
		packet = append(packet, byte(led.Index), led.R, led.G, led.B)
	}

	if _, err := conn.Write(packet); err != nil {
		return fmt.Errorf("write warls: %w", err)
	}
	return nil
}

func hostFromURL(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("parse device url %q: %w", raw, err)
	}
	host := u.Hostname()
	if host == "" {
		return "", fmt.Errorf("device url %q has no host", raw)
	}
	return host, nil
}
