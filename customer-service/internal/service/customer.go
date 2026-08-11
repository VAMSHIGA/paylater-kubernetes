// Package service implements Customer domain operations.
//
// Today the layer is intentionally thin (persist and list) so credit-limit and
// reporting rules stay in Reporting Service rather than being duplicated here.
package service

import (
	"context"

	"paylater/customer-service/db/sqlc"
	"paylater/customer-service/internal/repository"
)

// CustomerService contains all business logic related to customers.
type CustomerService struct {
	repo *repository.Repository
}

// NewCustomerService creates a new CustomerService. constructor to create a objects
func NewCustomerService(repo *repository.Repository) *CustomerService {
	return &CustomerService{
		repo: repo,
	}
}

// CreateCustomer creates a new customer in the database.
//
// When user_id is not provided, the service attempts to link the profile to an
// existing customer-role identity user with the same email.
func (s *CustomerService) CreateCustomer(
	ctx context.Context,
	params sqlc.CreateCustomerParams,
) error {
	if !params.UserID.Valid {
		userID, err := s.repo.LookupCustomerUserIDByEmail(ctx, params.Email)
		if err != nil {
			return err
		}
		params.UserID = userID
	}

	_, err := s.repo.CreateCustomer(ctx, params)
	if err != nil {
		return err
	}

	return nil
}

// ListCustomers retrieves all customers from the database.
func (s *CustomerService) ListCustomers(
	ctx context.Context,
) ([]sqlc.Customer, error) {

	customers, err := s.repo.ListCustomers(ctx)
	if err != nil {
		return nil, err
	}

	return customers, nil
}
