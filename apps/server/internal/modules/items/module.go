package items

import (
	"github.com/storganizer/server/internal/app"
	itemsmigrations "github.com/storganizer/server/internal/modules/items/migrations"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string                { return "items" }
func (m *Module) Dependencies() []string      { return []string{"tags"} }
func (m *Module) Migrations() []app.Migration { return itemsmigrations.All() }
func (m *Module) Init(_ core.App) error        { return nil }
func (m *Module) RegisterHooks(_ core.App)     {}
func (m *Module) RegisterRoutes(_ *router.Router[*core.RequestEvent]) {}
