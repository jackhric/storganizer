package devices

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		col := core.NewBaseCollection(Collection)
		col.Fields.Add(&core.TextField{Name: FieldName, Required: true})
		col.Fields.Add(&core.TextField{Name: FieldURL, Required: true})
		col.Fields.Add(&core.NumberField{Name: FieldLEDCount})
		col.Fields.Add(&core.NumberField{Name: FieldGridWidth})
		col.Fields.Add(&core.NumberField{Name: FieldGridHeight})
		col.Fields.Add(&core.BoolField{Name: FieldIsOnline})
		col.Fields.Add(&core.DateField{Name: FieldLastSeen})
		return app.Save(col)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(Collection)
		if err != nil {
			return nil // already gone
		}
		return app.Delete(col)
	})
}
