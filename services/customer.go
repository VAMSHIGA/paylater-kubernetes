package services

import (
	"context"

	"paylater/db/sqlc"
)

// CustomerService contains all business logic related to customers.
type CustomerService struct {
	queries *sqlc.Queries
}

// NewCustomerService creates a new CustomerService.
func NewCustomerService(q *sqlc.Queries) *CustomerService {
	return &CustomerService{
		queries: q,
	}
}

// CreateCustomer creates a new customer in the database.
func (s *CustomerService) CreateCustomer(
	ctx context.Context,
	params sqlc.CreateCustomerParams,
) error {

	// Call SQLC generated CreateCustomer query.
	_, err := s.queries.CreateCustomer(ctx, params)
	if err != nil {
		return err
	}

	return nil
}

// ListCustomers retrieves all customers from the database.
func (s *CustomerService) ListCustomers(
	ctx context.Context,
) ([]sqlc.Customer, error) {

	// Call the SQLC generated ListCustomers query.
	customers, err := s.queries.ListCustomers(ctx)
	if err != nil {
		return nil, err
	}

	// Return all customers to the handler.
	return customers, nil
}