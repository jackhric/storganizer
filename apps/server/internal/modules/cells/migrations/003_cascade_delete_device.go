package migrations

import (
	"fmt"

	"github.com/storganizer/server/internal/app"
	cellconsts "github.com/storganizer/server/internal/modules/cells/constants"

	"github.com/pocketbase/pocketbase/core"
)

var CascadeDeleteDevice = app.Migration{
	Name: "cells_cascade_delete_device",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(cellconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(cellconsts.FieldDeviceID).(*core.RelationField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", cellconsts.FieldDeviceID, cellconsts.Collection)
		}
		field.CascadeDelete = true
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(cellconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(cellconsts.FieldDeviceID).(*core.RelationField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", cellconsts.FieldDeviceID, cellconsts.Collection)
		}
		field.CascadeDelete = false
		return a.Save(col)
	},
}
