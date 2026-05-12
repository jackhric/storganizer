package cells

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/storganizer/server/internal/modules/devices"
)

func init() {
	// Importing the devices package guarantees devices.init() runs first,
	// so the devices collection exists when this migration executes.
	m.Register(func(app core.App) error {
		devicesCol, err := app.FindCollectionByNameOrId(devices.Collection)
		if err != nil {
			return err
		}

		col := core.NewBaseCollection(Collection)
		col.Fields.Add(&core.RelationField{
			Name:         FieldDeviceID,
			CollectionId: devicesCol.Id,
			Required:     true,
			MaxSelect:    1,
		})
		col.Fields.Add(&core.NumberField{Name: FieldLEDIndex, Required: true})
		col.Fields.Add(&core.TextField{Name: FieldLabel})
		return app.Save(col)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(Collection)
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
