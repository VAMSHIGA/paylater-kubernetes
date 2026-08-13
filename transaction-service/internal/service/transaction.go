// Package service implements Transaction domain operations.
//
// Creates purchase records with customer_id, merchant_id, amount, commission,
// and transaction_date. Existence checks against other service DBs are not
// performed here (documented FK limitation after DB split).
package service

import (
	"context"
	"errors"

	"paylater/shared/constants"
	"paylater/transaction-service/db/sqlc"
)

// ErrCustomerNotFound is returned when the customer_id does not exist.
var ErrCustomerNotFound = errors.New("customer not found")

// ErrMerchantNotFound is returned when the merchant_id does not exist.
var ErrMerchantNotFound = errors.New("merchant not found")

type transactionRepository interface {
	CustomerExists(ctx context.Context, customerID int64) (bool, error)
	MerchantExists(ctx context.Context, merchantID int64) (bool, error)
	CreateTransaction(
		ctx context.Context,
		params sqlc.CreateTransactionParams,
		enforceCreditLimit bool,
	) error
	ListTransactions(ctx context.Context) ([]sqlc.Transaction, error)
	ListTransactionsByCustomerID(ctx context.Context, customerID int64) ([]sqlc.Transaction, error)
}

// TransactionService contains the business logic related to PayLater transactions.
type TransactionService struct {
	repo transactionRepository
}

// NewTransactionService creates a new TransactionService.
func NewTransactionService(repo transactionRepository) *TransactionService {
	return &TransactionService{
		repo: repo,
	}
}

// CreateTransaction creates a new PayLater transaction.
func (s *TransactionService) CreateTransaction(
	ctx context.Context,
	params sqlc.CreateTransactionParams,
	callerRole string,
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

	enforceCreditLimit := callerRole == constants.RoleCustomer

	return s.repo.CreateTransaction(ctx, params, enforceCreditLimit)
}

// ListTransactions returns transactions visible to the caller.
func (s *TransactionService) ListTransactions(
	ctx context.Context,
	callerRole string,
	customerID int64,
) ([]sqlc.Transaction, error) {
	if callerRole == constants.RoleCustomer {
		return s.repo.ListTransactionsByCustomerID(ctx, customerID)
	}

	return s.repo.ListTransactions(ctx)
}
