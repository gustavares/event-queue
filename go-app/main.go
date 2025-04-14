package main

import (
	"log"

	"github.com/gustavares/event-queue/app"
	"github.com/gustavares/event-queue/config"
)

func main() {
	cfg := config.GetConfig()
	appInstance, err := app.Initialize(cfg)
	if err != nil {
		log.Fatalf("App initialization failed: %v", err)
	}
	defer appInstance.Close()

	// TODO prolly remove this from here or add some cli param to run it
	// runMigrations(appInstance.Datastore.Db, cfg)

	appInstance.Run()
}
