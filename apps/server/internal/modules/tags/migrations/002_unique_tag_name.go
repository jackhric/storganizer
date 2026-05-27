package migrations

import (
	"github.com/storganizer/server/internal/app"
	tagconsts "github.com/storganizer/server/internal/modules/tags/constants"

	"github.com/pocketbase/pocketbase/core"
)

var UniqueTagName = app.Migration{
	Name: "unique_tag_name",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(tagconsts.Collection)
		if err != nil {
			return err
		}
		col.AddIndex("idx_tags_name_unique", true, tagconsts.FieldName, "")
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(tagconsts.Collection)
		if err != nil {
			return err
		}
		col.RemoveIndex("idx_tags_name_unique")
		return a.Save(col)
	},
}
