package migrations

import (
	"fmt"

	"github.com/storganizer/server/internal/app"
	assignmentconsts "github.com/storganizer/server/internal/modules/assignments/constants"
	cellconsts "github.com/storganizer/server/internal/modules/cells/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CascadeDeleteCell = app.Migration{
	Name: "assignments_cascade_delete_cell",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(assignmentconsts.FieldCellID).(*core.RelationField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", cellconsts.FieldDeviceID, assignmentconsts.Collection)
		}
		field.CascadeDelete = true
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(assignmentconsts.FieldCellID).(*core.RelationField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", cellconsts.FieldDeviceID, assignmentconsts.Collection)
		}
		field.CascadeDelete = false
		return a.Save(col)
	},
}
