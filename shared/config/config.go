// Package config loads shared runtime configuration for PayLater microservices.
//
// Every service calls Load with its default HTTP port (for example "8081" for
// Identity). Values come from environment variables and an optional .env file.
// Required fields are MySQL connection settings and JWT_SECRET so services fail
// fast when misconfigured rather than at first request.
//
// Used by: identity-service, customer-service, merchant-service,
// transaction-service, payback-service, reporting-service.
package config

import (
	"os"

	"github.com/joho/godotenv"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
)

// Config holds common PayLater service runtime configuration
// (HTTP listen port, MySQL credentials, and JWT secret).
type Config struct {
	Server ServerConfig
	DB     DBConfig
	JWT    JWTConfig
}

// ServerConfig holds HTTP server settings.
type ServerConfig struct {
	Port string
}

// DBConfig holds MySQL connection settings for the service-owned database.
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

// JWTConfig holds the shared secret used to sign and validate tokens.
type JWTConfig struct {
	Secret string
}

// Load reads configuration from the environment.
//
// It attempts to load a .env file from the working directory (missing file is
// non-fatal). defaultHTTPPort is used when HTTP_PORT is unset so each service
// can keep its documented default without hard-coding ports elsewhere.
//
// Returns an error when database settings or JWT_SECRET are incomplete.
func Load(defaultHTTPPort string) (*Config, error) {
	loadOptionalEnvFile()

	cfg := &Config{
		Server: ServerConfig{
			Port: envOrDefault(constants.EnvHTTPPort, defaultHTTPPort),
		},
		DB: DBConfig{
			Host:     os.Getenv(constants.EnvDBHost),
			Port:     os.Getenv(constants.EnvDBPort),
			User:     os.Getenv(constants.EnvDBUser),
			Password: os.Getenv(constants.EnvDBPassword),
			Name:     os.Getenv(constants.EnvDBName),
		},
		JWT: JWTConfig{
			Secret: os.Getenv(constants.EnvJWTSecret),
		},
	}

	if cfg.DB.Host == "" || cfg.DB.Port == "" || cfg.DB.User == "" || cfg.DB.Name == "" {
		return nil, platformerrors.ErrDatabaseConfigIncomplete
	}

	if cfg.JWT.Secret == "" {
		return nil, platformerrors.ErrJWTSecretNotConfigured
	}

	return cfg, nil
}

// loadOptionalEnvFile loads a local .env file when present (development).
// Missing .env is normal in Docker/Kubernetes where env vars are injected.
// godotenv does not override variables already set in the process environment.
func loadOptionalEnvFile() {
	if _, err := os.Stat(".env"); err != nil {
		return
	}

	_ = godotenv.Load()
}

// envOrDefault returns the environment value for key, or defaultValue when unset.
func envOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return defaultValue
}
