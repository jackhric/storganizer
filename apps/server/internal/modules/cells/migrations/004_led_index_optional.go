package migrations

import (
	"fmt"

	"github.com/storganizer/server/internal/app"
	cellconsts "github.com/storganizer/server/internal/modules/cells/constants"

	"github.com/pocketbase/pocketbase/core"
)

// LEDIndexOptional drops the Required flag on cells.led_index.
// PocketBase's NumberField treats Required as "must be non-zero", which rejects
// led_index 0 — a perfectly valid first LED.
var LEDIndexOptional = app.Migration{
	Name: "cells_led_index_optional",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(cellconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(cellconsts.FieldLEDIndex).(*core.NumberField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", cellconsts.FieldLEDIndex, cellconsts.Collection)
		}
		field.Required = false
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(cellconsts.Collection)
		if err != nil {
			return err
		}
		field, ok := col.Fields.GetByName(cellconsts.FieldLEDIndex).(*core.NumberField)
		if !ok {
			return fmt.Errorf("field %q not found on %s", cellconsts.FieldLEDIndex, cellconsts.Collection)
		}
		field.Required = true
		return a.Save(col)
	},
}
