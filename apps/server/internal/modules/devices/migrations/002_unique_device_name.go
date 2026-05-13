package migrations

import (
	"github.com/storganizer/server/internal/app"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/pocketbase/pocketbase/core"
)

var UniqueDeviceName = app.Migration{
	Name: "unique_device_name",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(deviceconsts.Collection)
		if err != nil {
			return err
		}
		col.AddIndex("idx_devices_name_unique", true, deviceconsts.FieldName, "")
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(deviceconsts.Collection)
		if err != nil {
			return err
		}
		col.RemoveIndex("idx_devices_name_unique")
		return a.Save(col)
	},
}
