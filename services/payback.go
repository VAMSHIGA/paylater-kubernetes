package services

import (
	"context"

	"paylater/db/sqlc"
)

type PaybackService struct {
	queries *sqlc.Queries
}

// Create Payback Service
func NewPaybackService(queries *sqlc.Queries) *PaybackService {
	return &PaybackService{
		queries: queries,
	}
}

// Create Payback
func (s *PaybackService) CreatePayback(
	ctx context.Context,
	params sqlc.CreatePaybackParams,
) error {
	_, err := s.queries.CreatePayback(ctx, params)
	return err
}

// Get Payback by ID
func (s *PaybackService) GetPayback(
	ctx context.Context,
	id int64,
) (sqlc.Payback, error) {
	return s.queries.GetPayback(ctx, id)
}

// Get All Paybacks
func (s *PaybackService) ListPaybacks(
	ctx context.Context,
) ([]sqlc.Payback, error) {
	return s.queries.ListPaybacks(ctx)
}

// Delete Payback
func (s *PaybackService) DeletePayback(
	ctx context.Context,
	id int64,
) error {
	return s.queries.DeletePayback(ctx, id)
}