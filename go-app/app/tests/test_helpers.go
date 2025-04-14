package test

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/gustavares/event-queue/app"
	"github.com/gustavares/event-queue/config"
)

var testDB *sql.DB

func SetupTestDB() *sql.DB {
	dbHost := os.Getenv("TEST_DB_HOST")
	dbPort := os.Getenv("TEST_DB_PORT")
	dbUser := os.Getenv("TEST_DB_USER")
	dbPassword := os.Getenv("TEST_DB_PASSWORD")
	dbName := os.Getenv("TEST_DB_NAME")

	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		dbUser, dbPassword, dbHost, dbPort, dbName,
	)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to test database: %v", err)
	}

	if err != nil {
		log.Fatalf("Test database is not ready: %v", err)
	}

	log.Println("Connected to test database")
	testDB = db
	return db
}

// SetupTestApp initializes the App with the test database
func SetupTestApp() *app.App {
	cfg := &config.Config{
		Database: &config.DatabaseConfig{
			Host:     "db-test", // Match service name in docker-compose.test.yml
			Port:     "5432",
			User:     "test_user",
			Password: "test_password",
			Name:     "test_db",
		},
	}

	// Initialize test app
	appInstance, err := app.Initialize(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize test app: %v", err)
	}

	return appInstance
}

// CleanupTestDB closes the connection after tests
func CleanupTestDB() {
	if testDB != nil {
		testDB.Close()
		log.Println("Test database connection closed")
	}
}
