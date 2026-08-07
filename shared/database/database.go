// Package database provides a shared MySQL connection helper for PayLater services.
//
// Connect builds a DSN with parseTime=true so DATE/DATETIME columns scan into
// time.Time consistently across Identity, Customer, Merchant, Transaction,
// Payback, and Reporting services. Callers own closing the returned *sql.DB.
package database

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/go-sql-driver/mysql"

	"paylater/shared/config"
	"paylater/shared/logger"

	_ "github.com/go-sql-driver/mysql"
)

const (
	maxConnectAttempts = 10
	initialRetryDelay  = 2 * time.Second
)

// Connect opens and verifies a MySQL connection using the provided configuration.
//
// Retries ping failures so services can wait for Docker DNS and MySQL readiness
// during container startup. On success it logs a connection confirmation.
func Connect(cfg config.DBConfig) (*sql.DB, error) {
	mysqlCfg := mysql.Config{
		User:                 cfg.User,
		Passwd:               cfg.Password,
		Net:                  "tcp",
		Addr:                 fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		DBName:               cfg.Name,
		ParseTime:            true,
		AllowNativePasswords: true,
	}
	dsn := mysqlCfg.FormatDSN()

	var db *sql.DB
	var err error

	for attempt := 1; attempt <= maxConnectAttempts; attempt++ {
		db, err = sql.Open("mysql", dsn)
		if err != nil {
			return nil, err
		}

		err = db.Ping()
		if err == nil {
			logger.Info("MySQL Connected Successfully")
			return db, nil
		}

		_ = db.Close()

		if attempt < maxConnectAttempts {
			delay := time.Duration(attempt) * initialRetryDelay
			logger.Info(fmt.Sprintf("MySQL not ready (attempt %d/%d), retrying in %s", attempt, maxConnectAttempts, delay))
			time.Sleep(delay)
		}
	}

	return nil, err
}
