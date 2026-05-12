package cells

import (
	"fmt"

	cellconsts "github.com/storganizer/server/internal/modules/cells/constants"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// SyncCells creates a cell record for every LED on the device.
// Existing cells are left untouched; only new indices are inserted.
// Call this after SyncDevice has populated the device's led_count.
func SyncCells(app core.App, deviceID string) error {
	device, err := app.FindRecordById(deviceconsts.Collection, deviceID)
	if err != nil {
		return fmt.Errorf("device not found: %w", err)
	}

	ledCount := device.GetInt(deviceconsts.FieldLEDCount)
	if ledCount == 0 {
		return fmt.Errorf("device led_count is 0 — run sync first")
	}

	existing, err := app.FindRecordsByFilter(
		cellconsts.Collection,
		cellconsts.FieldDeviceID+" = {:dev}",
		"", 0, 0,
		dbx.Params{"dev": deviceID},
	)
	if err != nil {
		return err
	}

	taken := make(map[int]bool, len(existing))
	for _, r := range existing {
		taken[r.GetInt(cellconsts.FieldLEDIndex)] = true
	}

	col, err := app.FindCollectionByNameOrId(cellconsts.Collection)
	if err != nil {
		return err
	}

	for i := range ledCount {
		if taken[i] {
			continue
		}
		r := core.NewRecord(col)
		r.Set(cellconsts.FieldDeviceID, deviceID)
		r.Set(cellconsts.FieldLEDIndex, i)
		if err := app.Save(r); err != nil {
			return fmt.Errorf("insert cell %d: %w", i, err)
		}
	}
	return nil
}

// FindByDevice returns all cells belonging to a device, ordered by led_index.
func FindByDevice(app core.App, deviceID string) ([]*core.Record, error) {
	return app.FindRecordsByFilter(
		cellconsts.Collection,
		cellconsts.FieldDeviceID+" = {:dev}",
		cellconsts.FieldLEDIndex,
		0, 0,
		dbx.Params{"dev": deviceID},
	)
}
