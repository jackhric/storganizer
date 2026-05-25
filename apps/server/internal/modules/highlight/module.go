package highlight

import (
	"github.com/storganizer/server/internal/app"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string                 { return "highlight" }
func (m *Module) Dependencies() []string       { return []string{"devices"} }
func (m *Module) Migrations() []app.Migration  { return nil }
func (m *Module) Init(_ core.App) error        { return nil }
func (m *Module) RegisterHooks(_ core.App)     {}

// RegisterRoutes adds:
//
//	GET /api/devices/{id}/hover-stream — WebSocket; frontend streams LED
//	  frames, backend forwards as WARLS UDP. Used by useWarls.
func (m *Module) RegisterRoutes(r *router.Router[*core.RequestEvent]) {
	r.GET("/api/devices/{id}/hover-stream", handleHoverStream)
}
