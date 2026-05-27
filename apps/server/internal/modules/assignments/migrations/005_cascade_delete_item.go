package migrations

import (
	"fmt"

	"github.com/storganizer/server/internal/app"
	assignmentconsts "github.com/storganizer/server/internal/modules/assignments/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CascadeDeleteItem = app.Migration{
	Name: "assignments_cascade_delete_item",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(assignmentconsts.FieldItemID).(*core.RelationField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", assignmentconsts.FieldItemID, assignmentconsts.Collection)
		}
		field.CascadeDelete = true
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(assignmentconsts.FieldItemID).(*core.RelationField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", assignmentconsts.FieldItemID, assignmentconsts.Collection)
		}
		field.CascadeDelete = false
		return a.Save(col)
	},
}
