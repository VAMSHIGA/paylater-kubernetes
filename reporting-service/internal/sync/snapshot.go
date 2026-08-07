// Package sync refreshes the report_db read-model snapshot from domain databases.
//
// Reporting Service reads only from report_db. Domain microservices write to their
// own databases (customer_db, merchant_db, transaction_db, payback_db). This package
// copies those tables into report_db so report queries return current data.
package sync

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"sync"
)

var refreshMu sync.Mutex

// SourceDBs names the domain databases that feed the reporting snapshot.
// Defaults match PayLater Docker Compose database names.
type SourceDBs struct {
	Customer    string
	Merchant    string
	Transaction string
	Payback     string
}

// SourceDBsFromEnv returns domain database names, using PayLater defaults when unset.
func SourceDBsFromEnv() SourceDBs {
	return SourceDBs{
		Customer:    envOrDefault("REPORT_SOURCE_CUSTOMER_DB", "customer_db"),
		Merchant:    envOrDefault("REPORT_SOURCE_MERCHANT_DB", "merchant_db"),
		Transaction: envOrDefault("REPORT_SOURCE_TRANSACTION_DB", "transaction_db"),
		Payback:     envOrDefault("REPORT_SOURCE_PAYBACK_DB", "payback_db"),
	}
}

// RefreshSnapshot replaces report_db snapshot tables with current domain data.
//
// All domain databases must live on the same MySQL server as report_db. The
// connection must use credentials with SELECT on source DBs and write on report_db.
// A package-level mutex prevents concurrent refreshes from racing with report reads.
func RefreshSnapshot(ctx context.Context, db *sql.DB, sources SourceDBs) error {
	refreshMu.Lock()
	defer refreshMu.Unlock()

	log.Printf("report snapshot: starting refresh (sources: customer=%s merchant=%s transaction=%s payback=%s)",
		sources.Customer, sources.Merchant, sources.Transaction, sources.Payback)

	if err := logReportCounts(ctx, db, "before sync"); err != nil {
		log.Printf("report snapshot: warning counting report_db before sync: %v", err)
	}

	if err := logSourceCounts(ctx, db, sources); err != nil {
		return fmt.Errorf("snapshot refresh: cannot read source databases: %w", err)
	}

	// TRUNCATE is DDL and cannot run safely inside a sql.Tx (implicit commit in MySQL).
	// Run each step with autocommit on the shared pool connection.
	steps := []struct {
		name string
		sql  string
	}{
		{"disable_foreign_keys", "SET FOREIGN_KEY_CHECKS = 0"},
		{"truncate_paybacks", "TRUNCATE TABLE report_db.paybacks"},
		{"truncate_transactions", "TRUNCATE TABLE report_db.transactions"},
		{"truncate_merchants", "TRUNCATE TABLE report_db.merchants"},
		{"truncate_customers", "TRUNCATE TABLE report_db.customers"},
		{
			name: "copy_customers",
			sql: fmt.Sprintf(`INSERT INTO report_db.customers (id, name, email, credit_limit)
				SELECT id, name, email, credit_limit FROM %s.customers`, sources.Customer),
		},
		{
			name: "copy_merchants",
			sql: fmt.Sprintf(`INSERT INTO report_db.merchants (id, merchant_name, phone_number, onboarding, commission)
				SELECT id, merchant_name, phone_number, onboarding, commission FROM %s.merchants`, sources.Merchant),
		},
		{
			name: "copy_transactions",
			sql: fmt.Sprintf(`INSERT INTO report_db.transactions (id, customer_id, merchant_id, amount, commission, transaction_date)
				SELECT id, customer_id, merchant_id, amount, commission, transaction_date FROM %s.transactions`, sources.Transaction),
		},
		{
			name: "copy_paybacks",
			sql: fmt.Sprintf(`INSERT INTO report_db.paybacks (id, customer_id, amount, payment_date)
				SELECT id, customer_id, amount, payment_date FROM %s.paybacks`, sources.Payback),
		},
		{"enable_foreign_keys", "SET FOREIGN_KEY_CHECKS = 1"},
	}

	for _, step := range steps {
		result, err := db.ExecContext(ctx, step.sql)
		if err != nil {
			log.Printf("report snapshot: step %s failed: %v", step.name, err)
			return fmt.Errorf("snapshot refresh step %s failed: %w", step.name, err)
		}

		if rows, err := result.RowsAffected(); err == nil && rows > 0 {
			log.Printf("report snapshot: step %s copied %d row(s)", step.name, rows)
		} else {
			log.Printf("report snapshot: step %s completed", step.name)
		}
	}

	if err := logReportCounts(ctx, db, "after sync"); err != nil {
		log.Printf("report snapshot: warning counting report_db after sync: %v", err)
	}

	log.Println("report snapshot: refresh completed successfully")
	return nil
}

func logReportCounts(ctx context.Context, db *sql.DB, phase string) error {
	tables := []string{"customers", "merchants", "transactions", "paybacks"}
	for _, table := range tables {
		count, err := countRows(ctx, db, "report_db."+table)
		if err != nil {
			return err
		}
		log.Printf("report snapshot: %s report_db.%s row_count=%d", phase, table, count)
	}
	return nil
}

func logSourceCounts(ctx context.Context, db *sql.DB, sources SourceDBs) error {
	sourceTables := []struct {
		label string
		table string
	}{
		{"customer_db", sources.Customer + ".customers"},
		{"merchant_db", sources.Merchant + ".merchants"},
		{"transaction_db", sources.Transaction + ".transactions"},
		{"payback_db", sources.Payback + ".paybacks"},
	}

	for _, source := range sourceTables {
		count, err := countRows(ctx, db, source.table)
		if err != nil {
			return fmt.Errorf("%s: %w", source.label, err)
		}
		log.Printf("report snapshot: source %s row_count=%d", source.table, count)
	}

	return nil
}

func countRows(ctx context.Context, db *sql.DB, qualifiedTable string) (int64, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", qualifiedTable)
	var count int64
	if err := db.QueryRowContext(ctx, query).Scan(&count); err != nil {
		return 0, err
	}
	return count, nil
}

func envOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
