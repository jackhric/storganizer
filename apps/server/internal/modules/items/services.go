package items

import (
	itemconsts "github.com/storganizer/server/internal/modules/items/constants"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// FindByCategory returns all items belonging to the given category.
func FindByCategory(app core.App, category string) ([]*core.Record, error) {
	return app.FindRecordsByFilter(
		itemconsts.Collection,
		itemconsts.FieldCategory+" = {:cat}",
		itemconsts.FieldName,
		0, 0,
		dbx.Params{"cat": category},
	)
}
