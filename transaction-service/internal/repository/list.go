package repository

import (
	"context"

	"paylater/transaction-service/db/sqlc"
)

// ListTransactions returns all transactions ordered by newest first.
func (r *Repository) ListTransactions(ctx context.Context) ([]sqlc.Transaction, error) {
	return r.queries.ListTransactions(ctx)
}

// ListTransactionsByCustomerID returns transactions for a single customer.
func (r *Repository) ListTransactionsByCustomerID(
	ctx context.Context,
	customerID int64,
) ([]sqlc.Transaction, error) {
	return r.queries.ListTransactionsByCustomerID(ctx, customerID)
}
