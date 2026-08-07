// Package service implements Payback domain operations (customer repayments).
//
// CreatePayback persists amount and payment_date against a customer_id without
// recalculating dues; Reporting Service owns outstanding-balance aggregation.
package service

import (
	"context"

	"paylater/payback-service/db/sqlc"
	"paylater/payback-service/internal/repository"
)

// PaybackService contains the business logic related to customer repayments.
type PaybackService struct {
	repo *repository.Repository
}

// NewPaybackService creates a new PaybackService.
func NewPaybackService(repo *repository.Repository) *PaybackService {
	return &PaybackService{
		repo: repo,
	}
}

// CreatePayback creates a new repayment record.
func (s *PaybackService) CreatePayback(
	ctx context.Context,
	params sqlc.CreatePaybackParams,
) error {

	_, err := s.repo.CreatePayback(ctx, params)

	if err != nil {
		return err
	}

	return nil
}
