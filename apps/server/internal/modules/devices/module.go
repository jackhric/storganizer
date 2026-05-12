package devices

import (
	"net/http"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

// Module manages WLED device registration and the connectivity heartbeat.
type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string         { return "devices" }
func (m *Module) Dependencies() []string { return nil }

// Init registers the 5-second heartbeat that pings all devices.
func (m *Module) Init(app core.App) error {
	app.Cron().Add("devices-heartbeat", "@every 5s", func() {
		RunHeartbeat(app)
	})
	return nil
}

func (m *Module) RegisterHooks(_ core.App) {}

// RegisterRoutes adds:
//
//	POST /api/devices/:id/sync — pull LED info from WLED, update the device record.
func (m *Module) RegisterRoutes(r *router.Router[*core.RequestEvent]) {
	r.POST("/api/devices/{id}/sync", func(e *core.RequestEvent) error {
		id := e.Request.PathValue("id")
		if err := SyncDevice(e.App, id); err != nil {
			return e.BadRequestError("sync failed", err)
		}
		device, err := e.App.FindRecordById(Collection, id)
		if err != nil {
			return e.NotFoundError("device not found", err)
		}
		return e.JSON(http.StatusOK, map[string]any{
			"led_count":   device.GetInt(FieldLEDCount),
			"grid_width":  device.GetInt(FieldGridWidth),
			"grid_height": device.GetInt(FieldGridHeight),
		})
	})
}
