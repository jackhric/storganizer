package devices

import (
	"context"
	"fmt"
	"time"

	"github.com/pocketbase/pocketbase/core"
	"github.com/storganizer/server/internal/wled"
)

// RunHeartbeat pings every registered device and updates its is_online and
// last_seen fields. Intended to be called from the cron scheduler.
func RunHeartbeat(app core.App) {
	records, err := app.FindAllRecords(Collection)
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
	record, err := app.FindRecordById(Collection, deviceID)
	if err != nil {
		return fmt.Errorf("device not found: %w", err)
	}

	info, err := fetchInfo(record.GetString(FieldURL))
	if err != nil {
		return fmt.Errorf("WLED unreachable: %w", err)
	}

	record.Set(FieldLEDCount, info.LEDs.Count)
	record.Set(FieldGridWidth, info.LEDs.Matrix.Width)
	record.Set(FieldGridHeight, info.LEDs.Matrix.Height)
	record.Set(FieldIsOnline, true)
	record.Set(FieldLastSeen, time.Now().UTC())
	return app.Save(record)
}

// NewWLEDClient returns a wled.Client pointed at the given device record's URL.
// Exported so the highlight module can obtain a client without importing devices.
func NewWLEDClient(deviceURL string) *wled.Client {
	return wled.NewClient(deviceURL)
}

// pingDevice checks whether a device responds to /json/info and updates its
// is_online and last_seen fields. Errors are swallowed to keep the cron job stable.
func pingDevice(app core.App, record *core.Record) {
	_, err := fetchInfo(record.GetString(FieldURL))
	online := err == nil

	record.Set(FieldIsOnline, online)
	if online {
		record.Set(FieldLastSeen, time.Now().UTC())
	}
	_ = app.Save(record) // best-effort
}

func fetchInfo(deviceURL string) (*wled.Info, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	return wled.NewClient(deviceURL).FetchInfo(ctx)
}
