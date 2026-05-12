package migrations

import (
	"github.com/storganizer/server/internal/app"
	assignmentconsts "github.com/storganizer/server/internal/modules/assignments/constants"
	cellconsts "github.com/storganizer/server/internal/modules/cells/constants"
	itemconsts "github.com/storganizer/server/internal/modules/items/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CreateAssignments = app.Migration{
	Name: "create_assignments",
	Up: func(app core.App) error {
		itemsCol, err := app.FindCollectionByNameOrId(itemconsts.Collection)
		if err != nil {
			return err
		}
		cellsCol, err := app.FindCollectionByNameOrId(cellconsts.Collection)
		if err != nil {
			return err
		}

		col := core.NewBaseCollection(assignmentconsts.Collection)
		col.Fields.Add(&core.RelationField{
			Name:         assignmentconsts.FieldItemID,
			CollectionId: itemsCol.Id,
			Required:     true,
			MaxSelect:    1,
		})
		col.Fields.Add(&core.RelationField{
			Name:         assignmentconsts.FieldCellID,
			CollectionId: cellsCol.Id,
			Required:     true,
			MaxSelect:    1,
		})
		col.Fields.Add(&core.NumberField{Name: assignmentconsts.FieldQuantity, Required: true})
		return app.Save(col)
	},
	Down: func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return nil
		}
		return app.Delete(col)
	},
}
