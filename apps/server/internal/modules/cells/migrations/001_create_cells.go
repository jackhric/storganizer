package migrations

import (
	"github.com/storganizer/server/internal/app"
	cellconsts "github.com/storganizer/server/internal/modules/cells/constants"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CreateCells = app.Migration{
	Name: "create_cells",
	Up: func(app core.App) error {
		devicesCol, err := app.FindCollectionByNameOrId(deviceconsts.Collection)
		if err != nil {
			return err
		}

		col := core.NewBaseCollection(cellconsts.Collection)
		col.Fields.Add(&core.RelationField{
			Name:         cellconsts.FieldDeviceID,
			CollectionId: devicesCol.Id,
			Required:     true,
			MaxSelect:    1,
		})
		col.Fields.Add(&core.NumberField{Name: cellconsts.FieldLEDIndex, Required: true})
		col.Fields.Add(&core.TextField{Name: cellconsts.FieldLabel})
		return app.Save(col)
	},
	Down: func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(cellconsts.Collection)
		if err != nil {
			return nil
		}
		return app.Delete(col)
	},
}
