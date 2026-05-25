package assignments

import (
	"net/http"

	"github.com/storganizer/server/internal/app"
	assignmentsmigrations "github.com/storganizer/server/internal/modules/assignments/migrations"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string                { return "assignments" }
func (m *Module) Dependencies() []string      { return []string{"items", "cells"} }
func (m *Module) Migrations() []app.Migration { return assignmentsmigrations.All() }
func (m *Module) Init(_ core.App) error        { return nil }
func (m *Module) RegisterHooks(_ core.App)     {}

// RegisterRoutes adds:
//
//	POST /api/assignments/move — move (or swap) an assignment between cells.
func (m *Module) RegisterRoutes(r *router.Router[*core.RequestEvent]) {
	r.POST("/api/assignments/move", func(e *core.RequestEvent) error {
		var body struct {
			FromCellID string `json:"from_cell_id"`
			ToCellID   string `json:"to_cell_id"`
		}
		if err := e.BindBody(&body); err != nil {
			return e.BadRequestError("invalid request body", err)
		}
		if err := MoveOrSwap(e.App, body.FromCellID, body.ToCellID); err != nil {
			return e.BadRequestError("move failed", err)
		}
		return e.JSON(http.StatusOK, map[string]any{"ok": true})
	})
}
