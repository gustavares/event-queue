package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gustavares/event-queue/app"
	"github.com/gustavares/event-queue/config"
)

func requestPasscode(w http.ResponseWriter, r *http.Request) {
	type RequestPasscodeBody struct {
		Email string `json:"email"`
	}

	// TODO: Validate user Email

	var rp RequestPasscodeBody
	err := json.NewDecoder(r.Body).Decode(&rp)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
}

func main() {
	cfg := config.GetConfig()
	app := &app.App{}

	if err := app.Initialize(cfg); err != nil {
		log.Fatalf("App initialization failed: %v", err)
	}
	defer app.Close()

	// TODO prolly remove this from here or add some cli param to run it
	runMigrations(app.Db, cfg)

	app.Run()
}
