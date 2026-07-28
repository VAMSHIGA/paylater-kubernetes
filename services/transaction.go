package services

import (
	"context"

	"paylater/db/sqlc"
)

type TransactionService struct {
	queries *sqlc.Queries
}

// Create Transaction Service
func NewTransactionService(queries *sqlc.Queries) *TransactionService {
	return &TransactionService{
		queries: queries,
	}
}

// Create Transaction
func (s *TransactionService) CreateTransaction(
	ctx context.Context,
	params sqlc.CreateTransactionParams,
) error {
	_, err := s.queries.CreateTransaction(ctx, params)
	return err
}

// Get Transaction by ID
func (s *TransactionService) GetTransaction(
	ctx context.Context,
	id int64,
) (sqlc.Transaction, error) {
	return s.queries.GetTransaction(ctx, id)
}

// Get All Transactions
func (s *TransactionService) ListTransactions(
	ctx context.Context,
) ([]sqlc.Transaction, error) {
	return s.queries.ListTransactions(ctx)
}

// Update Transaction
func (s *TransactionService) UpdateTransaction(
	ctx context.Context,
	params sqlc.UpdateTransactionParams,
) error {
	return s.queries.UpdateTransaction(ctx, params)
}

// Delete Transaction
func (s *TransactionService) DeleteTransaction(
	ctx context.Context,
	id int64,
) error {
	return s.queries.DeleteTransaction(ctx, id)
}