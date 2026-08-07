// Package service implements Merchant domain operations against merchant_db.
//
// CreateMerchant persists onboarding data; UpdateMerchantCommission changes
// only the commission percentage used by merchant-fee reporting.
package service

import (
	"context"

	"paylater/merchant-service/db/sqlc"
	"paylater/merchant-service/internal/repository"
)

// MerchantService contains the business logic related to merchants.
type MerchantService struct {
	repo *repository.Repository
}

// NewMerchantService creates a new MerchantService.
func NewMerchantService(repo *repository.Repository) *MerchantService {
	return &MerchantService{
		repo: repo,
	}
}

// CreateMerchant creates/onboards a new merchant.
func (s *MerchantService) CreateMerchant(
	ctx context.Context,
	params sqlc.CreateMerchantParams,
) error {

	_, err := s.repo.CreateMerchant(ctx, params)
	if err != nil {
		return err
	}

	return nil
}

// UpdateMerchantCommission updates only the commission percentage
// of an existing merchant.
func (s *MerchantService) UpdateMerchantCommission(
	ctx context.Context,
	params sqlc.UpdateMerchantCommissionParams,
) error {

	err := s.repo.UpdateMerchantCommission(ctx, params)
	if err != nil {
		return err
	}

	return nil
}
