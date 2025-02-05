package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gustavares/event-queue/config"
)

func main() {
	// Load configuration
	cfg := config.GetConfig()
	fmt.Printf("Loaded Config: %+v\n", cfg) // DEBUG: Print config

	// PostgreSQL connection string
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.Database.User, cfg.Database.Password, cfg.Database.Host, cfg.Database.Port, cfg.Database.Name)

	fmt.Println("Connecting to database...") // DEBUG: Print before connection
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Unable to connect to database: %v", err)
	}
	defer db.Close()

	fmt.Println("Successfully connected to database!") // DEBUG: Ensure connection worked
	// Run migrations if enabled
	fmt.Println("Running migrations...") // DEBUG: Print before running migrations
	runMigrations(db)
	if cfg.Env.RunMigrations && cfg.Env.GoEnv != "production" {
		runMigrations(db)
	}

	router := http.NewServeMux()

	// router.HandleFunc("POST /event", func(w http.ResponseWriter, r *http.Request) {

	// })

	server := http.Server{
		Addr:    ":8080",
		Handler: router,
	}

	fmt.Println("Server listening on port :8080")
	log.Fatal(server.ListenAndServe())
}
