// Package integrationtest provides MySQL helpers for PayLater repository integration tests.
//
// Tests use dedicated paylater_it_* databases on the same MySQL server as the
// application. They never modify application databases (customer_db, etc.).
package integrationtest

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"

	"paylater/shared/balance"

	_ "github.com/go-sql-driver/mysql"
)

const (
	CustomerDBName    = "paylater_it_customer_db"
	TransactionDBName = "paylater_it_transaction_db"
	PaybackDBName     = "paylater_it_payback_db"

	envMySQLHost     = "INTEGRATION_TEST_MYSQL_HOST"
	envMySQLPort     = "INTEGRATION_TEST_MYSQL_PORT"
	envMySQLUser     = "INTEGRATION_TEST_MYSQL_USER"
	envMySQLPassword = "INTEGRATION_TEST_MYSQL_PASSWORD"
)

// MySQLConfig holds connection settings for integration tests.
type MySQLConfig struct {
	Host     string
	Port     string
	User     string
	Password string
}

// Environment provides shared MySQL access for integration tests.
type Environment struct {
	Root   *sql.DB
	Config MySQLConfig
}

var (
	setupOnce sync.Once
	sharedEnv *Environment
	setupErr  error
)

// Setup connects to MySQL and ensures isolated integration-test databases exist.
func Setup() (*Environment, error) {
	setupOnce.Do(func() {
		loadOptionalRootEnvFile()

		cfg := MySQLConfig{
			Host:     envOrDefault(envMySQLHost, "127.0.0.1"),
			Port:     envOrDefault(envMySQLPort, "3308"),
			User:     envOrDefault(envMySQLUser, "root"),
			Password: os.Getenv(envMySQLPassword),
		}

		if cfg.Password == "" {
			cfg.Password = os.Getenv("MYSQL_ROOT_PASSWORD")
		}

		root, err := openDB(cfg, "")
		if err != nil {
			setupErr = err
			return
		}

		if err := ensureSchema(root); err != nil {
			_ = root.Close()
			setupErr = err
			return
		}

		sharedEnv = &Environment{
			Root:   root,
			Config: cfg,
		}
	})

	if setupErr != nil {
		return nil, setupErr
	}

	return sharedEnv, nil
}

// ConfigureRepositoryEnv points repository cross-database queries at integration DBs.
func ConfigureRepositoryEnv() {
	os.Setenv(balance.EnvCustomerDB, CustomerDBName)
	os.Setenv(balance.EnvTransactionDB, TransactionDBName)
	os.Setenv(balance.EnvPaybackDB, PaybackDBName)
}

// OpenServiceDB opens a connection pinned to a specific integration database.
func (e *Environment) OpenServiceDB(dbName string) (*sql.DB, error) {
	return openDB(e.Config, dbName)
}

// CreateCustomer inserts a unique test customer and registers cleanup.
func (e *Environment) CreateCustomer(t *testing.T, creditLimit string) int64 {
	t.Helper()

	email := fmt.Sprintf("it-%d-%d@test.invalid", time.Now().UnixNano(), os.Getpid())
	name := fmt.Sprintf("Integration Test %d", time.Now().UnixNano())

	result, err := e.Root.Exec(
		fmt.Sprintf(`INSERT INTO %s.customers (name, email, credit_limit) VALUES (?, ?, ?)`, CustomerDBName),
		name,
		email,
		creditLimit,
	)
	if err != nil {
		t.Fatalf("create customer: %v", err)
	}

	customerID, err := result.LastInsertId()
	if err != nil {
		t.Fatalf("customer id: %v", err)
	}

	t.Cleanup(func() {
		e.cleanupCustomer(customerID)
	})

	return customerID
}

func (e *Environment) cleanupCustomer(customerID int64) {
	_, _ = e.Root.Exec(
		fmt.Sprintf("DELETE FROM %s.paybacks WHERE customer_id = ?", PaybackDBName),
		customerID,
	)
	_, _ = e.Root.Exec(
		fmt.Sprintf("DELETE FROM %s.transactions WHERE customer_id = ?", TransactionDBName),
		customerID,
	)
	_, _ = e.Root.Exec(
		fmt.Sprintf("DELETE FROM %s.customers WHERE id = ?", CustomerDBName),
		customerID,
	)
}

// InsertTransaction inserts a transaction row directly for test setup.
func (e *Environment) InsertTransaction(t *testing.T, customerID int64, amount string) {
	t.Helper()

	_, err := e.Root.Exec(
		fmt.Sprintf(`INSERT INTO %s.transactions (customer_id, merchant_id, amount, commission, transaction_date)
			VALUES (?, 1, ?, '1.00', '2026-08-01')`, TransactionDBName),
		customerID,
		amount,
	)
	if err != nil {
		t.Fatalf("insert transaction: %v", err)
	}
}

// InsertPayback inserts a payback row directly for test setup.
func (e *Environment) InsertPayback(t *testing.T, customerID int64, amount string) {
	t.Helper()

	_, err := e.Root.Exec(
		fmt.Sprintf(`INSERT INTO %s.paybacks (customer_id, amount, payment_date)
			VALUES (?, ?, '2026-08-01')`, PaybackDBName),
		customerID,
		amount,
	)
	if err != nil {
		t.Fatalf("insert payback: %v", err)
	}
}

// RemainingDue returns total_transaction - total_repaid for a customer.
func (e *Environment) RemainingDue(t *testing.T, customerID int64) string {
	t.Helper()

	query := fmt.Sprintf(`
		SELECT CAST(
			COALESCE((SELECT SUM(amount) FROM %s.transactions WHERE customer_id = ?), 0)
			- COALESCE((SELECT SUM(amount) FROM %s.paybacks WHERE customer_id = ?), 0)
			AS CHAR
		)`, TransactionDBName, PaybackDBName)

	var remaining string
	if err := e.Root.QueryRow(query, customerID, customerID).Scan(&remaining); err != nil {
		t.Fatalf("remaining due: %v", err)
	}

	return remaining
}

// CountPaybacks returns payback rows for a customer in the integration DB.
func (e *Environment) CountPaybacks(t *testing.T, customerID int64) int64 {
	t.Helper()

	var count int64
	err := e.Root.QueryRow(
		fmt.Sprintf("SELECT COUNT(*) FROM %s.paybacks WHERE customer_id = ?", PaybackDBName),
		customerID,
	).Scan(&count)
	if err != nil {
		t.Fatalf("count paybacks: %v", err)
	}

	return count
}

// CountTransactions returns transaction rows for a customer in the integration DB.
func (e *Environment) CountTransactions(t *testing.T, customerID int64) int64 {
	t.Helper()

	var count int64
	err := e.Root.QueryRow(
		fmt.Sprintf("SELECT COUNT(*) FROM %s.transactions WHERE customer_id = ?", TransactionDBName),
		customerID,
	).Scan(&count)
	if err != nil {
		t.Fatalf("count transactions: %v", err)
	}

	return count
}

// HoldCustomerLock acquires the advisory lock and returns a release function.
func (e *Environment) HoldCustomerLock(t *testing.T, lockName string) func() {
	t.Helper()

	conn, err := e.Root.Conn(t.Context())
	if err != nil {
		t.Fatalf("conn: %v", err)
	}

	var status sql.NullInt64
	if err := conn.QueryRowContext(t.Context(), "SELECT GET_LOCK(?, 10)", lockName).Scan(&status); err != nil {
		_ = conn.Close()
		t.Fatalf("get lock: %v", err)
	}
	if !status.Valid || status.Int64 != 1 {
		_ = conn.Close()
		t.Fatalf("lock unavailable: %s", lockName)
	}

	return func() {
		_, _ = conn.ExecContext(t.Context(), "SELECT RELEASE_LOCK(?)", lockName)
		_ = conn.Close()
	}
}

func openDB(cfg MySQLConfig, dbName string) (*sql.DB, error) {
	mysqlCfg := mysql.Config{
		User:                 cfg.User,
		Passwd:               cfg.Password,
		Net:                  "tcp",
		Addr:                 fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		DBName:               dbName,
		ParseTime:            true,
		AllowNativePasswords: true,
		MultiStatements:      true,
	}

	db, err := sql.Open("mysql", mysqlCfg.FormatDSN())
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	return db, nil
}

func ensureSchema(root *sql.DB) error {
	ddl := fmt.Sprintf(`
		CREATE DATABASE IF NOT EXISTS %s;
		CREATE DATABASE IF NOT EXISTS %s;
		CREATE DATABASE IF NOT EXISTS %s;

		CREATE TABLE IF NOT EXISTS %s.customers (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			user_id BIGINT NULL,
			name VARCHAR(100) NOT NULL,
			email VARCHAR(100) NOT NULL UNIQUE,
			credit_limit DECIMAL(10,2) NOT NULL,
			UNIQUE KEY idx_customers_user_id (user_id)
		);

		CREATE TABLE IF NOT EXISTS %s.transactions (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			customer_id BIGINT NOT NULL,
			merchant_id BIGINT NOT NULL,
			amount DECIMAL(10,2) NOT NULL,
			commission DECIMAL(10,2) NOT NULL,
			transaction_date DATE NOT NULL
		);

		CREATE TABLE IF NOT EXISTS %s.paybacks (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			customer_id BIGINT NOT NULL,
			amount DECIMAL(10,2) NOT NULL,
			payment_date DATE NOT NULL
		);
	`,
		CustomerDBName,
		TransactionDBName,
		PaybackDBName,
		CustomerDBName,
		TransactionDBName,
		PaybackDBName,
	)

	_, err := root.Exec(ddl)
	return err
}

func loadOptionalRootEnvFile() {
	_ = godotenv.Load(".env")

	candidates := []string{
		"../.env",
		"../../.env",
	}
	for _, candidate := range candidates {
		if abs, err := filepath.Abs(candidate); err == nil {
			_ = godotenv.Load(abs)
		}
	}
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// RequireMySQL skips the test when the integration environment is unavailable.
func RequireMySQL(t *testing.T) *Environment {
	t.Helper()

	env, err := Setup()
	if err != nil {
		t.Skipf("MySQL integration environment unavailable: %v", err)
	}

	ConfigureRepositoryEnv()
	return env
}
