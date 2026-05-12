package cells

import (
	"fmt"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/storganizer/server/internal/modules/devices"
)

// SyncCells creates a cell record for every LED on the device.
// Existing cells are left untouched; only new indices are inserted.
// Call this after SyncDevice has populated the device's led_count.
func SyncCells(app core.App, deviceID string) error {
	device, err := app.FindRecordById(devices.Collection, deviceID)
	if err != nil {
		return fmt.Errorf("device not found: %w", err)
	}

	ledCount := device.GetInt(devices.FieldLEDCount)
	if ledCount == 0 {
		return fmt.Errorf("device led_count is 0 — run sync first")
	}

	// Collect existing LED indices for this device.
	existing, err := app.FindRecordsByFilter(
		Collection,
		FieldDeviceID+" = {:dev}",
		"", 0, 0,
		dbx.Params{"dev": deviceID},
	)
	if err != nil {
		return err
	}

	taken := make(map[int]bool, len(existing))
	for _, r := range existing {
		taken[r.GetInt(FieldLEDIndex)] = true
	}

	// Insert missing cells.
	col, err := app.FindCollectionByNameOrId(Collection)
	if err != nil {
		return err
	}

	for i := range ledCount {
		if taken[i] {
			continue
		}
		r := core.NewRecord(col)
		r.Set(FieldDeviceID, deviceID)
		r.Set(FieldLEDIndex, i)
		if err := app.Save(r); err != nil {
			return fmt.Errorf("insert cell %d: %w", i, err)
		}
	}
	return nil
}

// FindByDevice returns all cells belonging to a device, ordered by led_index.
func FindByDevice(app core.App, deviceID string) ([]*core.Record, error) {
	return app.FindRecordsByFilter(
		Collection,
		FieldDeviceID+" = {:dev}",
		FieldLEDIndex,
		0, 0,
		dbx.Params{"dev": deviceID},
	)
}
