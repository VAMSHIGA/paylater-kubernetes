package migrate

import (
	"context"
	"database/sql"
	"fmt"
)

const defaultIdentityDB = "identity_db"

func ApplyUserIDLinkage(ctx context.Context, db *sql.DB, identityDB string) error {
	if db == nil {
		return fmt.Errorf("database connection is required")
	}

	if identityDB == "" {
		identityDB = defaultIdentityDB
	}

	hasColumn, err := columnExists(ctx, db, "merchants", "user_id")
	if err != nil {
		return fmt.Errorf("check merchants.user_id column: %w", err)
	}

	if !hasColumn {
		if _, err := db.ExecContext(ctx, `ALTER TABLE merchants ADD COLUMN user_id BIGINT NULL`); err != nil {
			return fmt.Errorf("add merchants.user_id column: %w", err)
		}
	}

	hasIndex, err := indexExists(ctx, db, "merchants", "idx_merchants_user_id")
	if err != nil {
		return fmt.Errorf("check merchants user_id index: %w", err)
	}

	if !hasIndex {
		if _, err := db.ExecContext(ctx, `CREATE UNIQUE INDEX idx_merchants_user_id ON merchants (user_id)`); err != nil {
			return fmt.Errorf("create merchants user_id index: %w", err)
		}
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
