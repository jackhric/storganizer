package assignments

import (
	"errors"

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

// MoveOrSwap moves the assignment at fromCellID to toCellID.
//
// If toCellID is empty, the source assignment's cell_id is updated to that
// cell. If toCellID already has an assignment, the two assignments swap cells.
//
// The unique index on assignments.cell_id means a naive in-place swap fails
// mid-transaction, so we delete the target first, move the source onto its
// cell, then recreate the target on the source's old cell. Wrapped in a
// transaction so a partial failure leaves the prior state intact.
func MoveOrSwap(app core.App, fromCellID, toCellID string) error {
	if fromCellID == "" || toCellID == "" {
		return errors.New("fromCellID and toCellID are required")
	}
	if fromCellID == toCellID {
		return nil
	}

	return app.RunInTransaction(func(txApp core.App) error {
		source, err := FindByCell(txApp, fromCellID)
		if err != nil {
			return err
		}
		if source == nil {
			return errors.New("no assignment found at fromCellID")
		}

		target, err := FindByCell(txApp, toCellID)
		if err != nil {
			return err
		}

		if target == nil {
			source.Set(assignmentconsts.FieldCellID, toCellID)
			return txApp.Save(source)
		}

		targetItemID := target.GetString(assignmentconsts.FieldItemID)
		targetQuantity := target.GetFloat(assignmentconsts.FieldQuantity)

		if err := txApp.Delete(target); err != nil {
			return err
		}

		source.Set(assignmentconsts.FieldCellID, toCellID)
		if err := txApp.Save(source); err != nil {
			return err
		}

		col, err := txApp.FindCollectionByNameOrId(assignmentconsts.Collection)
		if err != nil {
			return err
		}
		recreated := core.NewRecord(col)
		recreated.Set(assignmentconsts.FieldItemID, targetItemID)
		recreated.Set(assignmentconsts.FieldCellID, fromCellID)
		recreated.Set(assignmentconsts.FieldQuantity, targetQuantity)
		return txApp.Save(recreated)
	})
}
