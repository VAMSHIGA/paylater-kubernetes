// Package repository is the data-access layer for Merchant Service (merchant_db).
package repository

import (
	"context"
	"database/sql"

	"paylater/merchant-service/db/sqlc"
)

// Repository wraps SQLC queries for merchant persistence.
type Repository struct {
	queries *sqlc.Queries
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
	}
}

// CreateMerchant inserts a new merchant record.
func (r *Repository) CreateMerchant(
	ctx context.Context,
	params sqlc.CreateMerchantParams,
) (sql.Result, error) {
	return r.queries.CreateMerchant(ctx, params)
}

// UpdateMerchantCommission updates commission for a merchant by id.
func (r *Repository) UpdateMerchantCommission(
	ctx context.Context,
	params sqlc.UpdateMerchantCommissionParams,
) error {
	return r.queries.UpdateMerchantCommission(ctx, params)
}
