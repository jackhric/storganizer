package main

import (
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

func main() {
	app := pocketbase.New()

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// Register custom routes and hooks here
		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
