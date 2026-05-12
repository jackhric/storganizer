package assignments

import (
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
func (m *Module) RegisterRoutes(_ *router.Router[*core.RequestEvent]) {}
