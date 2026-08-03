// Package database provides a shared MySQL connection helper for PayLater services.
//
// Connect builds a DSN with parseTime=true so DATE/DATETIME columns scan into
// time.Time consistently across Identity, Customer, Merchant, Transaction,
// Payback, and Reporting services. Callers own closing the returned *sql.DB.
package database

import (
	"database/sql"
	"fmt"

	"paylater/shared/config"
	"paylater/shared/logger"

	_ "github.com/go-sql-driver/mysql"
)

// Connect opens and verifies a MySQL connection using the provided configuration.
//
// On success it logs a connection confirmation. On failure it returns the
// open or ping error without logging secrets.
func Connect(cfg config.DBConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		cfg.User,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Name,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	logger.Info("MySQL Connected Successfully")

	return db, nil
}
