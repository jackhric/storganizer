package main

import (
	"log"

	"github.com/storganizer/server/internal/app"
	"github.com/storganizer/server/internal/modules/assignments"
	"github.com/storganizer/server/internal/modules/cells"
	"github.com/storganizer/server/internal/modules/devices"
	"github.com/storganizer/server/internal/modules/items"
	"github.com/storganizer/server/internal/modules/tags"
	"github.com/storganizer/server/internal/modules/warls"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/osutils"
)

func main() {
	pb := pocketbase.New()

	migratecmd.MustRegister(pb, pb.RootCmd, migratecmd.Config{
		Automigrate: osutils.IsProbablyGoRun(),
	})

	if err := app.Register(pb,
		devices.New(),
		items.New(),
		cells.New(),
		assignments.New(),
		warls.New(),
		tags.New(),
		// Add new modules here.
	); err != nil {
		log.Fatal(err)
	}

	if err := pb.Start(); err != nil {
		log.Fatal(err)
	}
}
