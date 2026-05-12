package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/storganizer/server/internal/app"
	"github.com/storganizer/server/internal/modules/assignments"
	"github.com/storganizer/server/internal/modules/cells"
	"github.com/storganizer/server/internal/modules/devices"
	"github.com/storganizer/server/internal/modules/highlight"
	"github.com/storganizer/server/internal/modules/items"
)

func main() {
	pb := pocketbase.New()

	if err := app.Register(pb, []app.Module{
		devices.New(),
		items.New(),
		cells.New(),
		assignments.New(),
		highlight.New(),
	}); err != nil {
		log.Fatal(err)
	}

	if err := pb.Start(); err != nil {
		log.Fatal(err)
	}
}
