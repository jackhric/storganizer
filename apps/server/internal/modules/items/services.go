package items

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// FindByCategory returns all items belonging to the given category.
func FindByCategory(app core.App, category string) ([]*core.Record, error) {
	return app.FindRecordsByFilter(
		Collection,
		FieldCategory+" = {:cat}",
		FieldName,
		0, 0,
		dbx.Params{"cat": category},
	)
}
