package services

import (
	"context"

	"paylater/db/sqlc"
)

type CustomerService struct {
	queries *sqlc.Queries
}

// Constructor
func NewCustomerService(q *sqlc.Queries) *CustomerService {
	return &CustomerService{
		queries: q,
	}
}

// Create Customer
func (s *CustomerService) CreateCustomer(ctx context.Context, arg sqlc.CreateCustomerParams) error {
	_, err := s.queries.CreateCustomer(ctx, arg)
	if err != nil {
		return err
	}

	return nil
}

// Get Customer by ID
func (s *CustomerService) GetCustomer(ctx context.Context, id int64) (sqlc.Customer, error) {
	return s.queries.GetCustomer(ctx, id)
}

// Get All Customers
func (s *CustomerService) ListCustomers(ctx context.Context) ([]sqlc.Customer, error) {
	return s.queries.ListCustomers(ctx)
}

// Update Customer
func (s *CustomerService) UpdateCustomer(ctx context.Context, arg sqlc.UpdateCustomerParams) error {
	return s.queries.UpdateCustomer(ctx, arg)
}

// Delete Customer
func (s *CustomerService) DeleteCustomer(ctx context.Context, id int64) error {
	return s.queries.DeleteCustomer(ctx, id)
}