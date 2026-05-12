package app

import (
	"fmt"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// Register resolves module dependencies, initializes each module in order,
// and wires hooks and routes into the PocketBase app.
func Register(pb *pocketbase.PocketBase, modules []Module) error {
	ordered, err := topoSort(modules)
	if err != nil {
		return fmt.Errorf("module dependency error: %w", err)
	}

	for _, mod := range ordered {
		if err := mod.Init(pb); err != nil {
			return fmt.Errorf("module %q init: %w", mod.Name(), err)
		}
		mod.RegisterHooks(pb)
	}

	pb.OnServe().BindFunc(func(se *core.ServeEvent) error {
		for _, mod := range ordered {
			mod.RegisterRoutes(se.Router)
		}
		return se.Next()
	})

	return nil
}

// topoSort returns modules in dependency-first order.
// It detects circular and missing dependencies.
func topoSort(modules []Module) ([]Module, error) {
	byName := make(map[string]Module, len(modules))
	for _, m := range modules {
		byName[m.Name()] = m
	}

	visited := make(map[string]bool)
	inStack := make(map[string]bool)
	var result []Module

	var visit func(name string) error
	visit = func(name string) error {
		if visited[name] {
			return nil
		}
		if inStack[name] {
			return fmt.Errorf("circular dependency at %q", name)
		}
		mod, ok := byName[name]
		if !ok {
			return fmt.Errorf("unknown dependency %q", name)
		}
		inStack[name] = true
		for _, dep := range mod.Dependencies() {
			if err := visit(dep); err != nil {
				return err
			}
		}
		inStack[name] = false
		visited[name] = true
		result = append(result, mod)
		return nil
	}

	for _, m := range modules {
		if err := visit(m.Name()); err != nil {
			return nil, err
		}
	}
	return result, nil
}
