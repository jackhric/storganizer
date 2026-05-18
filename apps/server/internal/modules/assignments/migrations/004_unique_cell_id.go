package migrations

import (
	"github.com/storganizer/server/internal/app"
	assignmentconsts "github.com/storganizer/server/internal/modules/assignments/constants"

	"github.com/pocketbase/pocketbase/core"
)

var UniqueCellID = app.Migration{
	Name: "assignments_unique_cell_id",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		col.AddIndex("idx_assignments_cell_id_unique", true, assignmentconsts.FieldCellID, "")
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		col.RemoveIndex("idx_assignments_cell_id_unique")
		return a.Save(col)
	},
}
