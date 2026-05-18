package migrations

import (
	"github.com/storganizer/server/internal/app"
	deviceconsts "github.com/storganizer/server/internal/modules/devices/constants"

	"github.com/pocketbase/pocketbase/core"
)

var UniqueDeviceURL = app.Migration{
	Name: "unique_device_url",
	Up: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(deviceconsts.Collection)
		if err != nil {
			return err
		}
		col.AddIndex("idx_devices_url_unique", true, deviceconsts.FieldURL, "")
		return a.Save(col)
	},
	Down: func(a core.App) error {
		col, err := a.FindCollectionByNameOrId(deviceconsts.Collection)
		if err != nil {
			return err
		}
		col.RemoveIndex("idx_devices_url_unique")
		return a.Save(col)
	},
}
