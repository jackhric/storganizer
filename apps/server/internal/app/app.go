package app

import (
	"fmt"
	"os"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func Register(app core.App, modules ...Module) error {
	sorted, err := resolveDependencies(modules)
	if err != nil {
		return err
	}

	registerMigrations(sorted)

	for _, m := range sorted {
		if err := m.Init(app); err != nil {
			return fmt.Errorf("module %q init: %w", m.Name(), err)
		}
		m.RegisterHooks(app)
	}

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		for _, m := range sorted {
			m.RegisterRoutes(se.Router)
		}

		return se.Next()
	})

	return nil
}

func registerMigrations(sorted []Module) {
	order := 0
	for _, m := range sorted {
		for _, mig := range m.Migrations() {
			order++
			name := fmt.Sprintf("%03d_%s.go", order, mig.Name)
			core.AppMigrations.Register(mig.Up, mig.Down, name)
		}
	}
}

// resolveDependencies performs a topological sort of modules based on their
// declared dependencies using Kahn's algorithm.
func resolveDependencies(modules []Module) ([]Module, error) {
	byName := make(map[string]Module, len(modules))
	for _, m := range modules {
		name := m.Name()
		if _, exists := byName[name]; exists {
			return nil, fmt.Errorf("duplicate module name: %q", name)
		}
		byName[name] = m
	}

	inDegree := make(map[string]int, len(modules))
	dependents := make(map[string][]string, len(modules))

	for _, m := range modules {
		name := m.Name()
		for _, dep := range m.Dependencies() {
			if _, ok := byName[dep]; !ok {
				return nil, fmt.Errorf("module %q depends on unknown module %q", name, dep)
			}
			dependents[dep] = append(dependents[dep], name)
			inDegree[name]++
		}
	}

	var queue []string
	for _, m := range modules {
		if inDegree[m.Name()] == 0 {
			queue = append(queue, m.Name())
		}
	}

	sorted := make([]Module, 0, len(modules))
	for len(queue) > 0 {
		name := queue[0]
		queue = queue[1:]
		sorted = append(sorted, byName[name])

		for _, dep := range dependents[name] {
			inDegree[dep]--
			if inDegree[dep] == 0 {
				queue = append(queue, dep)
			}
		}
	}

	if len(sorted) != len(modules) {
		return nil, fmt.Errorf("circular dependency detected among modules")
	}

	return sorted, nil
}
