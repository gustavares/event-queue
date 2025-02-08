package app

import (
	"log"
	"net/http"

	"github.com/gustavares/event-queue/app/api"
	"github.com/gustavares/event-queue/app/datastore"
	"github.com/gustavares/event-queue/config"
)

type App struct {
	Datastore *datastore.Datastore
	Handlers  *api.Handlers
	Config    *config.Config
}

func Initialize(c *config.Config) (*App, error) {
	d, err := datastore.New(c)
	if err != nil {
		return nil, err
	}

	h := api.NewHandlers(d)

	return &App{
		Datastore: d,
		Handlers:  h,
		Config:    c,
	}, nil
}

func (a *App) Run() {
	log.Println("Server listening on port :8080")
	log.Fatal(http.ListenAndServe(":8080", a.Handlers.RegisterRoutes()))
}

func (a *App) Close() {
	if a.Datastore.Db != nil {
		a.Datastore.Db.Close()
		log.Println("Database connection closed")
	}
}
