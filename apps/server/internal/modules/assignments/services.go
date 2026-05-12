package assignments

import (
	assignmentconsts "github.com/storganizer/server/internal/modules/assignments/constants"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
)

// FindByItem returns all assignments for a given item ID.
func FindByItem(app core.App, itemID string) ([]*core.Record, error) {
	return app.FindRecordsByFilter(
		assignmentconsts.Collection,
		assignmentconsts.FieldItemID+" = {:item}",
		"", 0, 0,
		dbx.Params{"item": itemID},
	)
}

// FindByCell returns the assignment occupying a given cell, if any.
func FindByCell(app core.App, cellID string) (*core.Record, error) {
	records, err := app.FindRecordsByFilter(
		assignmentconsts.Collection,
		assignmentconsts.FieldCellID+" = {:cell}",
		"", 1, 0,
		dbx.Params{"cell": cellID},
	)
	if err != nil || len(records) == 0 {
		return nil, err
	}
	return records[0], nil
}
