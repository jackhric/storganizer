package migrations

import "github.com/storganizer/server/internal/app"

func All() []app.Migration {
	return []app.Migration{CreateCells, OpenRules, CascadeDeleteDevice}
}
