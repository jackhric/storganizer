package migrations

import (
	"github.com/storganizer/server/internal/app"
	itemconsts "github.com/storganizer/server/internal/modules/items/constants"
	tagconsts "github.com/storganizer/server/internal/modules/tags/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CreateItems = app.Migration{
	Name: "create_items",
	Up: func(app core.App) error {
		tagsCol, err := app.FindCollectionByNameOrId(tagconsts.Collection)
		if err != nil {
			return err
		}

		col := core.NewBaseCollection(itemconsts.Collection)
		col.Fields.Add(&core.TextField{Name: itemconsts.FieldName, Required: true})
		col.Fields.Add(&core.FileField{
			Name:      itemconsts.FieldImage,
			MaxSelect: 1,
			MaxSize:   5 * 1024 * 1024,
			MimeTypes: []string{"image/jpeg", "image/png", "image/webp"},
		})
		col.Fields.Add(&core.TextField{Name: itemconsts.FieldStoreURL})
		col.Fields.Add(&core.TextField{Name: itemconsts.FieldNotes})
		col.Fields.Add(&core.JSONField{Name: itemconsts.FieldExternalLinks})
		col.Fields.Add(&core.RelationField{
			Name:          itemconsts.FieldTags,
			CollectionId:  tagsCol.Id,
			CascadeDelete: false,
			MinSelect:     0,
			MaxSelect:     999,
		})
		return app.Save(col)
	},
	Down: func(app core.App) error {
		col, err := app.FindCollectionByNameOrId(itemconsts.Collection)
		if err != nil {
			return nil
		}
		return app.Delete(col)
	},
}
