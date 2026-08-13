// Package service implements Payback domain operations (customer repayments).
//
// CreatePayback validates customer existence and, for customer-role callers,
// ensures the repayment does not exceed outstanding due.
package service

import (
	"context"
	"errors"

	"paylater/payback-service/db/sqlc"
	"paylater/shared/constants"
)

// ErrCustomerNotFound is returned when the customer_id does not exist.
var ErrCustomerNotFound = errors.New("customer not found")

type paybackRepository interface {
	CustomerExists(ctx context.Context, customerID int64) (bool, error)
	CreatePayback(
		ctx context.Context,
		params sqlc.CreatePaybackParams,
		enforceBalanceValidation bool,
	) error
	ListPaybacks(ctx context.Context) ([]sqlc.Payback, error)
	ListPaybacksByCustomerID(ctx context.Context, customerID int64) ([]sqlc.Payback, error)
}

// PaybackService contains the business logic related to customer repayments.
type PaybackService struct {
	repo paybackRepository
}

// NewPaybackService creates a new PaybackService.
func NewPaybackService(repo paybackRepository) *PaybackService {
	return &PaybackService{
		repo: repo,
	}
}

// CreatePayback creates a new repayment record.
func (s *PaybackService) CreatePayback(
	ctx context.Context,
	params sqlc.CreatePaybackParams,
	callerRole string,
) error {
	exists, err := s.repo.CustomerExists(ctx, params.CustomerID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrCustomerNotFound
	}

	// Always enforce remaining-due validation so outstanding balance cannot go
	// negative, regardless of caller role (customer or admin).
	return s.repo.CreatePayback(ctx, params, true)
}

// ListPaybacks returns paybacks visible to the caller.
func (s *PaybackService) ListPaybacks(
	ctx context.Context,
	callerRole string,
	customerID int64,
) ([]sqlc.Payback, error) {
	if callerRole == constants.RoleCustomer {
		return s.repo.ListPaybacksByCustomerID(ctx, customerID)
	}

	return s.repo.ListPaybacks(ctx)
}
