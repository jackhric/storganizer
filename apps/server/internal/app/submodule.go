package app

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

// Submodule is a module owned by a parent Module rather than registered
// directly via app.Register. Parents instantiate submodules in their New()
// constructor, delegate Init/RegisterHooks/RegisterRoutes to them, and
// concatenate their Migrations() into the parent's own slice.
//
// Unlike Module, Submodule has no Name or Dependencies — ordering is
// determined by the parent's slice order, and dependencies are implicit
// (a submodule cannot be instantiated without its parent).
type Submodule interface {
	Init(app core.App) error
	RegisterHooks(app core.App)
	RegisterRoutes(r *router.Router[*core.RequestEvent])
	Migrations() []Migration
}
