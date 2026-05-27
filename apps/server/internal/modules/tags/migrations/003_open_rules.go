package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/types"
	"github.com/storganizer/server/internal/app"
	tagconsts "github.com/storganizer/server/internal/modules/tags/constants"
)

var OpenRules = app.Migration{
	Name: "tags_open_rules",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(tagconsts.Collection)
		if err != nil {
			return err
		}
		col.ListRule = types.Pointer("")
		col.ViewRule = types.Pointer("")
		col.CreateRule = types.Pointer("")
		col.UpdateRule = types.Pointer("")
		col.DeleteRule = types.Pointer("")
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(tagconsts.Collection)
		if err != nil {
			return err
		}
		col.ListRule = nil
		col.ViewRule = nil
		col.CreateRule = nil
		col.UpdateRule = nil
		col.DeleteRule = nil
		return a.Save(col)
	},
}
