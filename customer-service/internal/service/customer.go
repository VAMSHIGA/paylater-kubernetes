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

// NewCustomerService creates a new CustomerService.
func NewCustomerService(repo *repository.Repository) *CustomerService {
	return &CustomerService{
		repo: repo,
	}
}

// CreateCustomer creates a new customer in the database.
func (s *CustomerService) CreateCustomer(
	ctx context.Context,
	params sqlc.CreateCustomerParams,
) error {

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
