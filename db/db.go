// Package db contains the legacy monolith MySQL connector.
//
// The API gateway no longer opens a database; each microservice connects via
// paylater/shared/database to its own schema. This helper remains for local
// tooling or a future cleanup of leftover monolith SQLC under db/sqlc.
// Prefer shared/database for new service code.
package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

// ConnectDB opens MySQL using DB_* environment variables from .env.
//
// Deprecated for runtime paths: the gateway does not call this after full
// service extraction. Returns a ping-verified *sql.DB or an error.
func ConnectDB() (*sql.DB, error) {

	err := godotenv.Load()
	if err != nil {
		log.Println(".env file not found")
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	fmt.Println("✅ MySQL Connected Successfully")

	return db, nil
}
