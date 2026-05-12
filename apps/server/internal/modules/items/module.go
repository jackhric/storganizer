package items

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

// Module owns the items collection (component catalog).
type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string          { return "items" }
func (m *Module) Dependencies() []string { return nil }
func (m *Module) Init(_ core.App) error  { return nil }
func (m *Module) RegisterHooks(_ core.App) {}
func (m *Module) RegisterRoutes(_ *router.Router[*core.RequestEvent]) {}
