package main

import (
	"database/sql"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/gustavares/event-queue/config"
	_ "github.com/lib/pq"
)

func runMigrations(db *sql.DB, cfg *config.Config) {
	migrationsPath := cfg.Env.MigrationsPath
	// Get the environment
	// env := os.Getenv("GO_ENV")

	// // If in production, only run migrations if explicitly enabled
	// if env == "production" && os.Getenv("RUN_MIGRATIONS") != "true" {
	// 	log.Println("Migrations are disabled in production. Set RUN_MIGRATIONS=true to enable.")
	// 	return
	// }

	log.Println("Running database migrations...")

	// Configure migration driver
	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("Could not create migration driver: %v", err)
	}

	// Load migrations
	m, err := migrate.NewWithDatabaseInstance(
		"file://"+migrationsPath,
		"postgres", driver,
	)
	if err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	// Run migrations
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("Migration failed: %v", err)
	}

	log.Println("Migrations completed successfully!")
}
