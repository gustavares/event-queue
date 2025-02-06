package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type DatabaseConfig struct {
	User     string
	Password string
	Name     string
	Host     string
	Port     string
}

type Env struct {
	GoEnv          string
	RunMigrations  bool
	MigrationsPath string
}

type Config struct {
	Database *DatabaseConfig
	Env      *Env
}

// Global configuration variable
var AppConfig *Config

// LoadConfig initializes Viper and loads environment variables
func LoadConfig() *Config {
	viper.SetConfigFile("./.env")
	viper.SetConfigType("env")
	viper.AutomaticEnv() // Automatically map environment variables

	// Replace dots and hyphens in env variable names
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))

	// Read from file if available
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("No .env file found")
	}

	// Parse configuration into the struct
	AppConfig = &Config{
		Database: &DatabaseConfig{
			User:     viper.GetString("POSTGRES_USER"),
			Password: viper.GetString("POSTGRES_PASSWORD"),
			Name:     viper.GetString("POSTGRES_DB"),
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetString("DB_PORT"),
		},
		Env: &Env{
			GoEnv:          viper.GetString("GO_ENV"),
			RunMigrations:  viper.GetBool("RUN_MIGRATIONS"),
			MigrationsPath: viper.GetString("MIGRATIONS_PATH"),
		},
	}

	return AppConfig
}

// TODO stop using a global variable, just return the config to be set in the app struct

// GetConfig returns the global AppConfig object
func GetConfig() *Config {
	if AppConfig == nil {
		LoadConfig()
	}
	return AppConfig
}
