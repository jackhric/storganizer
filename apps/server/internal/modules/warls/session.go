package warls

import (
	"context"
	"encoding/json"
	"errors"

	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/coder/websocket"
	"github.com/pocketbase/pocketbase/core"
)

// setMessage is the only JSON shape the session WebSocket accepts. The frontend
// publishes the full desired LED state for every device it wants to drive in
// one message; a device that drops out of `Frames` is cleared.
//
//	{"type":"set","frames":{"<deviceId>":[{"idx":3,"r":255,"g":0,"b":0}]}}
//	{"type":"set","frames":{}}                    // clear everything
type setMessage struct {
	Type   string             `json:"type"`
	Frames map[string][]frame `json:"frames"`
}

type frame struct {
	Idx int   `json:"idx"`
	R   uint8 `json:"r"`
	G   uint8 `json:"g"`
	B   uint8 `json:"b"`
}

// newSessionHandler returns a handler that upgrades the request to WebSocket
// and binds the connection to the given Registry. On disconnect, every device
// this session touched is cleared.
//
// Last-write-wins across sessions: a different session (or future HA
// integration) setting the same device URL replaces this session's frame.
func newSessionHandler(reg *Registry) func(*core.RequestEvent) error {
	return func(e *core.RequestEvent) error {
		conn, err := websocket.Accept(e.Response, e.Request, &websocket.AcceptOptions{
			// Browser dev servers run on a different origin than the
			// backend. We're inside the local network, so this is acceptable.
			InsecureSkipVerify: true,
		})
		if err != nil {
			return err
		}
		defer conn.Close(websocket.StatusInternalError, "closing")

		// Device URLs this session has currently set. Used to clear them all
		// on disconnect.
		ownedURLs := make(map[string]struct{})

		ctx := e.Request.Context()
		for {
			_, data, err := conn.Read(ctx)
			if err != nil {
				for url := range ownedURLs {
					reg.Clear(url)
				}
				if errors.Is(err, context.Canceled) ||
					websocket.CloseStatus(err) == websocket.StatusNormalClosure ||
					websocket.CloseStatus(err) == websocket.StatusGoingAway {
					return nil
				}
				return nil
			}

			var msg setMessage
			if err := json.Unmarshal(data, &msg); err != nil {
				continue
			}
			if msg.Type != "set" {
				continue
			}

			// Resolve device id → URL once per message. Build the new owned
			// set so we can clear any device that dropped out.
			nextOwned := make(map[string]struct{}, len(msg.Frames))
			for deviceID, frames := range msg.Frames {
				device, err := e.App.FindRecordById(deviceconsts.Collection, deviceID)
				if err != nil {
					continue
				}
				url := device.GetString(deviceconsts.FieldURL)
				if url == "" {
					continue
				}
				leds := make([]LED, 0, len(frames))
				for _, f := range frames {
					leds = append(leds, LED{Idx: f.Idx, R: f.R, G: f.G, B: f.B})
				}
				reg.Set(url, leds)
				nextOwned[url] = struct{}{}
			}
			for url := range ownedURLs {
				if _, kept := nextOwned[url]; !kept {
					reg.Clear(url)
				}
			}
			ownedURLs = nextOwned
		}
	}
}
