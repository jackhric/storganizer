package migrations

import (
	"github.com/storganizer/server/internal/app"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CreateDevices = app.Migration{
	Name: "create_devices",
	Up: func(app core.App) error {
		col := core.NewBaseCollection(deviceconsts.Collection)
		col.Fields.Add(&core.TextField{Name: deviceconsts.FieldName, Required: true})
		col.Fields.Add(&core.TextField{Name: deviceconsts.FieldURL, Required: true})
		col.Fields.Add(&core.NumberField{Name: deviceconsts.FieldLEDCount})
		col.Fields.Add(&core.NumberField{Name: deviceconsts.FieldGridWidth})
		col.Fields.Add(&core.NumberField{Name: deviceconsts.FieldGridHeight})
		col.Fields.Add(&core.BoolField{Name: deviceconsts.FieldIsOnline})
		col.Fields.Add(&core.DateField{Name: deviceconsts.FieldLastSeen})
		return app.Save(col)
	},
	Down: func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(deviceconsts.Collection)
		if err != nil {
			return nil // already gone
		}
		return app.Delete(col)
	},
}
