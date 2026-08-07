// Package repository is the data-access layer for Reporting Service (report_db).
//
// Wraps the four SQLC report queries used by admin dashboards. Generated SQLC
// code under db/sqlc must not be edited by hand.
package repository

import (
	"context"
	"database/sql"

	"paylater/reporting-service/db/sqlc"
)

// Repository wraps SQLC queries for report aggregations.
type Repository struct {
	queries *sqlc.Queries
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
	}
}

// GetMerchantFee returns merchant names and commissions.
func (r *Repository) GetMerchantFee(
	ctx context.Context,
) ([]sqlc.GetMerchantFeeRow, error) {
	return r.queries.GetMerchantFee(ctx)
}

// GetCustomerDues returns per-customer dues information.
func (r *Repository) GetCustomerDues(
	ctx context.Context,
) ([]sqlc.GetCustomerDuesRow, error) {
	return r.queries.GetCustomerDues(ctx)
}

// GetUsersAtCreditLimit returns customers at or above credit limit.
func (r *Repository) GetUsersAtCreditLimit(
	ctx context.Context,
) ([]sqlc.GetUsersAtCreditLimitRow, error) {
	return r.queries.GetUsersAtCreditLimit(ctx)
}

// GetTotalDues returns system-wide total dues.
func (r *Repository) GetTotalDues(
	ctx context.Context,
) (interface{}, error) {
	return r.queries.GetTotalDues(ctx)
}
