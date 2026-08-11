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

	enforceBalanceValidation := callerRole == constants.RoleCustomer

	return s.repo.CreatePayback(ctx, params, enforceBalanceValidation)
}
