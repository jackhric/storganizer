package highlight

import (
	"net/http"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
	"github.com/storganizer/server/internal/modules/devices"
)

// Module owns the highlight routes. It has no collection of its own.
type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string { return "highlight" }
func (m *Module) Dependencies() []string {
	return []string{"devices", "items", "cells", "assignments"}
}
func (m *Module) Init(_ core.App) error    { return nil }
func (m *Module) RegisterHooks(_ core.App) {}

// RegisterRoutes adds:
//
//	POST /api/highlight        — light up cells for the given item IDs.
//	POST /api/highlight/clear  — turn off all LEDs on a specific device.
func (m *Module) RegisterRoutes(r *router.Router[*core.RequestEvent]) {
	r.POST("/api/highlight", func(e *core.RequestEvent) error {
		var req Request
		if err := e.BindBody(&req); err != nil {
			return e.BadRequestError("invalid request body", err)
		}
		if err := HighlightItems(e.App, req); err != nil {
			return e.BadRequestError("highlight failed", err)
		}
		return e.JSON(http.StatusOK, map[string]any{"ok": true})
	})

	r.POST("/api/highlight/clear", func(e *core.RequestEvent) error {
		var body struct {
			DeviceID string `json:"device_id"`
		}
		if err := e.BindBody(&body); err != nil {
			return e.BadRequestError("invalid request body", err)
		}

		device, err := e.App.FindRecordById(devices.Collection, body.DeviceID)
		if err != nil {
			return e.NotFoundError("device not found", err)
		}

		if err := ClearDevice(device.GetString(devices.FieldURL)); err != nil {
			return e.BadRequestError("clear failed", err)
		}
		return e.JSON(http.StatusOK, map[string]any{"ok": true})
	})
}
