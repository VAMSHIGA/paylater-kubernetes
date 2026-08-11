// Package migrate applies additive schema updates for customer_db.
package migrate

import (
	"context"
	"database/sql"
	"fmt"
)

const defaultIdentityDB = "identity_db"

// ApplyUserIDLinkage ensures customers.user_id exists and backfills links by email.
//
// Safe to call on every startup: skips ALTER when the column already exists and
// only backfills rows where user_id IS NULL.
func ApplyUserIDLinkage(ctx context.Context, db *sql.DB, identityDB string) error {
	if db == nil {
		return fmt.Errorf("database connection is required")
	}

	if identityDB == "" {
		identityDB = defaultIdentityDB
	}

	hasColumn, err := columnExists(ctx, db, "customers", "user_id")
	if err != nil {
		return fmt.Errorf("check customers.user_id column: %w", err)
	}

	if !hasColumn {
		if _, err := db.ExecContext(ctx, `ALTER TABLE customers ADD COLUMN user_id BIGINT NULL`); err != nil {
			return fmt.Errorf("add customers.user_id column: %w", err)
		}
	}

	hasIndex, err := indexExists(ctx, db, "customers", "idx_customers_user_id")
	if err != nil {
		return fmt.Errorf("check customers user_id index: %w", err)
	}

	if !hasIndex {
		if _, err := db.ExecContext(ctx, `CREATE UNIQUE INDEX idx_customers_user_id ON customers (user_id)`); err != nil {
			return fmt.Errorf("create customers user_id index: %w", err)
		}
	}

	backfillSQL := fmt.Sprintf(`
		UPDATE customers AS c
		INNER JOIN %s.users AS u
			ON c.email = u.email AND u.role = 'customer'
		SET c.user_id = u.id
		WHERE c.user_id IS NULL`, identityDB)

	if _, err := db.ExecContext(ctx, backfillSQL); err != nil {
		return fmt.Errorf("backfill customers.user_id: %w", err)
	}

	return nil
}

func columnExists(ctx context.Context, db *sql.DB, tableName, columnName string) (bool, error) {
	const query = `
		SELECT COUNT(*)
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = ?
			AND COLUMN_NAME = ?`

	var count int
	if err := db.QueryRowContext(ctx, query, tableName, columnName).Scan(&count); err != nil {
		return false, err
	}

	return count > 0, nil
}

func indexExists(ctx context.Context, db *sql.DB, tableName, indexName string) (bool, error) {
	const query = `
		SELECT COUNT(*)
		FROM information_schema.STATISTICS
		WHERE TABLE_SCHEMA = DATABASE()
			AND TABLE_NAME = ?
			AND INDEX_NAME = ?`

	var count int
	if err := db.QueryRowContext(ctx, query, tableName, indexName).Scan(&count); err != nil {
		return false, err
	}

	return count > 0, nil
}
