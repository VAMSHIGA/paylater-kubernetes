// Package service implements Transaction domain operations.
//
// Creates purchase records with customer_id, merchant_id, amount, commission,
// and transaction_date. Existence checks against other service DBs are not
// performed here (documented FK limitation after DB split).
package service

import (
	"context"

	"paylater/transaction-service/db/sqlc"
	"paylater/transaction-service/internal/repository"
)

// TransactionService contains the business logic related to PayLater transactions.
type TransactionService struct {
	repo *repository.Repository
}

// NewTransactionService creates a new TransactionService.
func NewTransactionService(repo *repository.Repository) *TransactionService {
	return &TransactionService{
		repo: repo,
	}
}

// CreateTransaction creates a new PayLater transaction.
func (s *TransactionService) CreateTransaction(
	ctx context.Context,
	params sqlc.CreateTransactionParams,
) error {

	_, err := s.repo.CreateTransaction(ctx, params)
	if err != nil {
		return err
	}

	return nil
}
