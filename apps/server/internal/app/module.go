package app

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

// Module is the contract every domain module must satisfy.
// Modules declare their dependencies; the app layer resolves them via
// topological sort and calls Init, RegisterHooks, and RegisterRoutes in order.
type Module interface {
	Name() string
	Dependencies() []string
	Init(app core.App) error
	RegisterHooks(app core.App)
	RegisterRoutes(r *router.Router[*core.RequestEvent])
}
