// Package service implements Transaction domain operations.
//
// Creates purchase records with customer_id, merchant_id, amount, commission,
// and transaction_date. Existence checks against other service DBs are not
// performed here (documented FK limitation after DB split).
package service

import (
	"context"
	"errors"

	"paylater/transaction-service/db/sqlc"
	"paylater/transaction-service/internal/repository"
)

// ErrCustomerNotFound is returned when the customer_id does not exist.
var ErrCustomerNotFound = errors.New("customer not found")

// ErrMerchantNotFound is returned when the merchant_id does not exist.
var ErrMerchantNotFound = errors.New("merchant not found")

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

	exists, err := s.repo.CustomerExists(ctx, params.CustomerID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrCustomerNotFound
	}

	exists, err = s.repo.MerchantExists(ctx, params.MerchantID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrMerchantNotFound
	}

	_, err = s.repo.CreateTransaction(ctx, params)
	if err != nil {
		return err
	}

	return nil
}
