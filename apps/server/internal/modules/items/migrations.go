package items

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		col := core.NewBaseCollection(Collection)
		col.Fields.Add(&core.TextField{Name: FieldName, Required: true})
		col.Fields.Add(&core.TextField{Name: FieldDescription})
		col.Fields.Add(&core.NumberField{Name: FieldQuantity, Required: true})
		col.Fields.Add(&core.FileField{
			Name:      FieldImage,
			MaxSelect: 1,
			MaxSize:   5 * 1024 * 1024, // 5 MB
			MimeTypes: []string{"image/jpeg", "image/png", "image/webp"},
		})
		col.Fields.Add(&core.TextField{Name: FieldCategory})
		col.Fields.Add(&core.TextField{Name: FieldDatasheetURL})
		return app.Save(col)
	}, func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(Collection)
		if err != nil {
			return nil
		}
		return app.Delete(col)
	})
}
