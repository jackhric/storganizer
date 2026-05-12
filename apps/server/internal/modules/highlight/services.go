package highlight

import (
	"context"
	"fmt"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/storganizer/server/internal/modules/assignments"
	"github.com/storganizer/server/internal/modules/cells"
	"github.com/storganizer/server/internal/modules/devices"
	"github.com/storganizer/server/internal/wled"
)

// Request is the payload for POST /api/highlight.
type Request struct {
	ItemIDs []string `json:"item_ids"`
	Color   struct {
		R uint8 `json:"r"`
		G uint8 `json:"g"`
		B uint8 `json:"b"`
	} `json:"color"`
}

// HighlightItems finds all cells assigned to the given items and lights them up
// on their respective WLED devices. LEDs for items not in the list are turned off.
// All WLED calls are batched per device (one HTTP request per device).
func HighlightItems(app core.App, req Request) error {
	if len(req.ItemIDs) == 0 {
		return nil
	}

	// Group target LED indices by device URL.
	byDevice := map[string][]wled.LEDColor{}

	for _, itemID := range req.ItemIDs {
		asgns, err := assignments.FindByItem(app, itemID)
		if err != nil {
			return fmt.Errorf("assignments for item %s: %w", itemID, err)
		}

		for _, a := range asgns {
			cell, err := app.FindRecordById(cells.Collection, a.GetString(assignments.FieldCellID))
			if err != nil {
				continue
			}

			device, err := app.FindRecordById(devices.Collection, cell.GetString(cells.FieldDeviceID))
			if err != nil {
				continue
			}

			url := device.GetString(devices.FieldURL)
			byDevice[url] = append(byDevice[url], wled.LEDColor{
				Index: cell.GetInt(cells.FieldLEDIndex),
				R:     req.Color.R,
				G:     req.Color.G,
				B:     req.Color.B,
			})
		}
	}

	for url, leds := range byDevice {
		client := wled.NewClient(url)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err := client.Highlight(ctx, leds)
		cancel()
		if err != nil {
			return fmt.Errorf("highlight device %s: %w", url, err)
		}
	}
	return nil
}

// ClearDevice turns off all LEDs on a single WLED device.
func ClearDevice(deviceURL string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return wled.NewClient(deviceURL).Clear(ctx)
}
