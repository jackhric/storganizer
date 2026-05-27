package migrations

import (
	"github.com/storganizer/server/internal/app"
	tagconsts "github.com/storganizer/server/internal/modules/tags/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CreateTags = app.Migration{
	Name: "create_tags",
	Up: func(a core.App) error {
		col := core.NewBaseCollection(tagconsts.Collection)
		col.Fields.Add(&core.TextField{Name: tagconsts.FieldName, Required: true})
		col.Fields.Add(&core.TextField{Name: tagconsts.FieldColor})
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(tagconsts.Collection)
		if err != nil {
			return nil
		}
		return a.Delete(col)
	},
}
