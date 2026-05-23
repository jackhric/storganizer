package devices

import (
	"context"
	"fmt"
	"time"

	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"
	"github.com/storganizer/server/internal/wled"

	"github.com/pocketbase/pocketbase/core"
)

// RunHeartbeat pings every registered device and updates its is_online and
// last_seen fields. Intended to be called from the cron scheduler.
func RunHeartbeat(app core.App) {
	records, err := app.FindAllRecords(deviceconsts.Collection)
	if err != nil {
		return
	}
	for _, r := range records {
		pingDevice(app, r)
	}
}

// SyncDevice fetches live LED info from WLED and writes led_count, grid_width,
// and grid_height back to the device record.
func SyncDevice(app core.App, deviceID string) error {
	record, err := app.FindRecordById(deviceconsts.Collection, deviceID)
	if err != nil {
		return fmt.Errorf("device not found: %w", err)
	}

	info, err := fetchInfo(record.GetString(deviceconsts.FieldURL))
	if err != nil {
		return fmt.Errorf("WLED unreachable: %w", err)
	}

	record.Set(deviceconsts.FieldLEDCount, info.LEDs.Count)
	record.Set(deviceconsts.FieldGridWidth, info.LEDs.Matrix.Width)
	record.Set(deviceconsts.FieldGridHeight, info.LEDs.Matrix.Height)
	record.Set(deviceconsts.FieldIsOnline, true)
	record.Set(deviceconsts.FieldLastSeen, time.Now().UTC())
	return app.Save(record)
}

// NewWLEDClient returns a wled.Client pointed at the given device URL.
// Exported so other modules can obtain a client without importing devices.
func NewWLEDClient(deviceURL string) *wled.Client {
	return wled.NewClient(deviceURL)
}

func pingDevice(app core.App, record *core.Record) {
	info, err := fetchInfo(record.GetString(deviceconsts.FieldURL))
	online := err == nil

	record.Set(deviceconsts.FieldIsOnline, online)
	if online {
		record.Set(deviceconsts.FieldLastSeen, time.Now().UTC())
		record.Set(deviceconsts.FieldLEDCount, info.LEDs.Count)
		record.Set(deviceconsts.FieldGridWidth, info.LEDs.Matrix.Width)
		record.Set(deviceconsts.FieldGridHeight, info.LEDs.Matrix.Height)
	}
	_ = app.Save(record) // best-effort
}

// ProbeDevice attempts to reach a WLED device at the given URL.
// Returns an error if the device is unreachable or does not respond with valid WLED data.
func ProbeDevice(deviceURL string) error {
	_, err := fetchInfo(deviceURL)
	return err
}

// PopulateFromWLED fetches live LED info from WLED and writes it onto the
// given record in memory (does not save). Intended for use in pre-save hooks
// where the caller will subsequently save the record.
func PopulateFromWLED(record *core.Record) error {
	info, err := fetchInfo(record.GetString(deviceconsts.FieldURL))
	if err != nil {
		return err
	}
	record.Set(deviceconsts.FieldLEDCount, info.LEDs.Count)
	record.Set(deviceconsts.FieldGridWidth, info.LEDs.Matrix.Width)
	record.Set(deviceconsts.FieldGridHeight, info.LEDs.Matrix.Height)
	record.Set(deviceconsts.FieldIsOnline, true)
	record.Set(deviceconsts.FieldLastSeen, time.Now().UTC())
	return nil
}

func fetchInfo(deviceURL string) (*wled.Info, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return wled.NewClient(deviceURL).FetchInfo(ctx)
}
