// Package repository is the data-access layer for Transaction Service (transaction_db).
package repository

import (
	"context"
	"database/sql"

	"paylater/transaction-service/db/sqlc"
)

// Repository wraps SQLC queries for transaction persistence.
type Repository struct {
	queries *sqlc.Queries
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
	}
}

// CreateTransaction inserts a new transaction record.
func (r *Repository) CreateTransaction(
	ctx context.Context,
	params sqlc.CreateTransactionParams,
) (sql.Result, error) {
	return r.queries.CreateTransaction(ctx, params)
}
