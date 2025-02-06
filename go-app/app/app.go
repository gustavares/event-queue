package app

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gustavares/event-queue/config"
)

type App struct {
	Db     *sql.DB
	Config *config.Config
}

func (a *App) Initialize(config *config.Config) error {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		config.Database.User,
		config.Database.Password,
		config.Database.Host,
		config.Database.Port,
		config.Database.Name,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("unable to connect to database: %v", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	return nil
}

func (a *App) routes() *http.ServeMux {
	mux := http.NewServeMux()

	// simple health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "OK")
	})

	return mux
}

func (a *App) Run() {
	log.Println("Server listening on port :8080")
	log.Fatal(http.ListenAndServe(":8080", a.routes()))
}

func (a *App) Close() {
	if a.Db != nil {
		a.Db.Close()
		log.Println("Database connection closed")
	}
}
