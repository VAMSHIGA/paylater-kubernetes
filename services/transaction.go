package services

import (
	"context"

	"paylater/db/sqlc"
)

// TransactionService contains the business logic
// related to PayLater transactions.
type TransactionService struct {
	queries *sqlc.Queries
}

// NewTransactionService creates a new TransactionService.
//
// SQLC Queries is passed to the service so that
// the service can communicate with the database.
func NewTransactionService(
	queries *sqlc.Queries,
) *TransactionService {

	return &TransactionService{
		queries: queries,
	}
}

// ==========================================================
// Create Transaction
// ==========================================================

// CreateTransaction creates a new PayLater transaction.
//
// A transaction happens when a customer purchases
// something from a merchant.
//
// Transaction contains:
// - Customer ID
// - Merchant ID
// - Amount
// - Commission
// - Transaction Date
func (s *TransactionService) CreateTransaction(
	ctx context.Context,
	params sqlc.CreateTransactionParams,
) error {

	// Call the SQLC generated CreateTransaction query.
	_, err := s.queries.CreateTransaction(ctx, params)

	// If database operation fails,
	// return the error to the handler.
	if err != nil {
		return err
	}

	return nil
}