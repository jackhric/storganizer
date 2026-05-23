package cells

import (
	"net/http"

	"github.com/storganizer/server/internal/app"
	cellsmigrations "github.com/storganizer/server/internal/modules/cells/migrations"
	"github.com/storganizer/server/internal/modules/devices"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string                { return "cells" }
func (m *Module) Dependencies() []string      { return []string{"devices"} }
func (m *Module) Migrations() []app.Migration { return cellsmigrations.All() }
func (m *Module) Init(_ core.App) error        { return nil }

// RegisterHooks subscribes to device record events so cells are auto-derived
// from the device's led_count. Cells are insert-only here: shrinking led_count
// will not delete orphan cells (deferred — destructive and cascades to assignments).
func (m *Module) RegisterHooks(pbApp core.App) {
	syncIfReady := func(e *core.RecordEvent) error {
		if e.Record.GetInt(deviceconsts.FieldLEDCount) > 0 {
			if err := SyncCells(e.App, e.Record.Id); err != nil {
				e.App.Logger().Error("cells auto-sync failed", "device_id", e.Record.Id, "error", err)
			}
		}
		return e.Next()
	}
	pbApp.OnRecordAfterCreateSuccess(deviceconsts.Collection).BindFunc(syncIfReady)
	pbApp.OnRecordAfterUpdateSuccess(deviceconsts.Collection).BindFunc(syncIfReady)
}

// RegisterRoutes adds:
//
//	POST /api/devices/:id/cells/sync — fetch LED count from WLED, create cell records.
func (m *Module) RegisterRoutes(r *router.Router[*core.RequestEvent]) {
	r.POST("/api/devices/{id}/cells/sync", func(e *core.RequestEvent) error {
		id := e.Request.PathValue("id")

		if err := devices.SyncDevice(e.App, id); err != nil {
			return e.BadRequestError("WLED sync failed", err)
		}
		if err := SyncCells(e.App, id); err != nil {
			return e.BadRequestError("cell sync failed", err)
		}

		cellList, err := FindByDevice(e.App, id)
		if err != nil {
			return e.InternalServerError("could not list cells", err)
		}
		return e.JSON(http.StatusOK, map[string]any{"count": len(cellList)})
	})
}
