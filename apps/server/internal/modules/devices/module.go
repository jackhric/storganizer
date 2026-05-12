package devices

import (
	"net/http"

	"github.com/storganizer/server/internal/app"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"
	devicesmigrations "github.com/storganizer/server/internal/modules/devices/migrations"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string            { return "devices" }
func (m *Module) Dependencies() []string  { return nil }
func (m *Module) Migrations() []app.Migration { return devicesmigrations.All() }

// Init registers the 5-second heartbeat that pings all devices.
func (m *Module) Init(pbApp core.App) error {
	pbApp.Cron().Add("devices-heartbeat", "@every 5s", func() {
		RunHeartbeat(pbApp)
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
		device, err := e.App.FindRecordById(deviceconsts.Collection, id)
		if err != nil {
			return e.NotFoundError("device not found", err)
		}
		return e.JSON(http.StatusOK, map[string]any{
			"led_count":   device.GetInt(deviceconsts.FieldLEDCount),
			"grid_width":  device.GetInt(deviceconsts.FieldGridWidth),
			"grid_height": device.GetInt(deviceconsts.FieldGridHeight),
		})
	})
}
