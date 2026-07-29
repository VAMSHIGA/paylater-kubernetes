package services

import (
	"context"

	"paylater/db/sqlc"
)

// PaybackService contains the business logic
// related to customer repayments.
type PaybackService struct {
	queries *sqlc.Queries
}

// NewPaybackService creates a new PaybackService.
//
// The SQLC Queries object is passed to this service
// so it can communicate with the MySQL database.
func NewPaybackService(
	queries *sqlc.Queries,
) *PaybackService {

	return &PaybackService{
		queries: queries,
	}
}

// ==========================================================
// Create Payback
// ==========================================================

// CreatePayback creates a new repayment record.
//
// A payback happens when a customer pays back
// some amount they owe.
//
// Payback contains:
// - Customer ID
// - Repayment amount
// - Payment date
func (s *PaybackService) CreatePayback(
	ctx context.Context,
	params sqlc.CreatePaybackParams,
) error {

	// Call the SQLC generated CreatePayback query.
	_, err := s.queries.CreatePayback(ctx, params)

	// If the database operation fails,
	// return the error to the handler.
	if err != nil {
		return err
	}

	// No error means the payback was created successfully.
	return nil
}