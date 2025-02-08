package datastore

import (
	"database/sql"
	"errors"
	"fmt"
	"log"

	"github.com/gustavares/event-queue/config"
)

var (
	ErrDbFailure         = errors.New("database failure")
	ErrUuidParseFailure  = errors.New("uuid parse failure")
	ErrInvalidNullString = errors.New("invalid null sql string")
)

type Datastore struct {
	Db   *sql.DB
	User UserDatastore
}

type user struct {
	db *sql.DB
}

func (u *user) GetByEmail(email string) (*UserEntity, error) {
	return nil, fmt.Errorf("not yet implemented")
}

type UserDatastore interface {
	GetByEmail(email string) (*UserEntity, error)
}

func New(c *config.Config) (*Datastore, error) {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Datastore initialized")
	return &Datastore{
		Db: db,
		User: &user{
			db: db,
		},
	}, nil
}
