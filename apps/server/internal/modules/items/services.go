package items

import (
	itemconsts "github.com/storganizer/server/internal/modules/items/constants"

	"github.com/pocketbase/pocketbase/core"
)

// FindAll returns all items sorted by name.
func FindAll(app core.App) ([]*core.Record, error) {
	return app.FindRecordsByFilter(
		itemconsts.Collection,
		"",
		itemconsts.FieldName,
		0, 0,
		nil,
	)
}
