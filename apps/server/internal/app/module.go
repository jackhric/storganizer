package app

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Migration struct {
	Name string
	Up func(app core.App) error
	Down func(app core.App) error
}

type Module interface {
	Name() string
	Dependencies() []string
	Migrations() []Migration
	Init(app core.App) error
	RegisterHooks(app core.App)

	// Only add routes when PocketBase's built-in API is insufficient.
	RegisterRoutes(r *router.Router[*core.RequestEvent])
}
