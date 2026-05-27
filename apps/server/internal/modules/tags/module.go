package tags

import (
	"github.com/storganizer/server/internal/app"
	tagsmigrations "github.com/storganizer/server/internal/modules/tags/migrations"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
)

type Module struct{}

func New() *Module { return &Module{} }

func (m *Module) Name() string { return "tags" }

func (m *Module) Dependencies() []string { return nil }
func (m *Module) Migrations() []app.Migration             { return tagsmigrations.All() }
func (m *Module) Init(_ core.App) error                   { return nil }
func (m *Module) RegisterHooks(_ core.App)                {}
func (m *Module) RegisterRoutes(_ *router.Router[*core.RequestEvent]) {}
