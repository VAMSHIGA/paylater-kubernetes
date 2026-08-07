// Package repository is the data-access layer for Payback Service (payback_db).
package repository

import (
	"context"
	"database/sql"

	"paylater/payback-service/db/sqlc"
)

// Repository wraps SQLC queries for payback persistence.
type Repository struct {
	queries *sqlc.Queries
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
	}
}

// CreatePayback inserts a new payback record.
func (r *Repository) CreatePayback(
	ctx context.Context,
	params sqlc.CreatePaybackParams,
) (sql.Result, error) {
	return r.queries.CreatePayback(ctx, params)
}
