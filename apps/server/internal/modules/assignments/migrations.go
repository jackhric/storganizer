package assignments

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/storganizer/server/internal/modules/cells"
	"github.com/storganizer/server/internal/modules/items"
)

func init() {
	// Importing items and cells ensures their init() runs before ours,
	// so both collections exist when this migration executes.
	m.Register(func(app core.App) error {
		itemsCol, err := app.FindCollectionByNameOrId(items.Collection)
		if err != nil {
			return err
		}
		cellsCol, err := app.FindCollectionByNameOrId(cells.Collection)
		if err != nil {
			return err
		}

		col := core.NewBaseCollection(Collection)
		col.Fields.Add(&core.RelationField{
			Name:         FieldItemID,
			CollectionId: itemsCol.Id,
			Required:     true,
			MaxSelect:    1,
		})
		col.Fields.Add(&core.RelationField{
			Name:         FieldCellID,
			CollectionId: cellsCol.Id,
			Required:     true,
			MaxSelect:    1,
		})
		col.Fields.Add(&core.NumberField{Name: FieldQuantity, Required: true})
		return app.Save(col)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(Collection)
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
