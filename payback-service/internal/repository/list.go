package repository

import (
	"context"

	"paylater/payback-service/db/sqlc"
)

// ListPaybacks returns all paybacks ordered by newest first.
func (r *Repository) ListPaybacks(ctx context.Context) ([]sqlc.Payback, error) {
	return r.queries.ListPaybacks(ctx)
}

// ListPaybacksByCustomerID returns paybacks for a single customer.
func (r *Repository) ListPaybacksByCustomerID(
	ctx context.Context,
	customerID int64,
) ([]sqlc.Payback, error) {
	return r.queries.ListPaybacksByCustomerID(ctx, customerID)
}
