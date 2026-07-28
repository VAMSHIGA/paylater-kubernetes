
package services

import (
	"context"

	"paylater/db/sqlc"
)

type MerchantService struct {
	queries *sqlc.Queries
}

func NewMerchantService(queries *sqlc.Queries) *MerchantService {
	return &MerchantService{
		queries: queries,
	}
}

// Create merchant
func (s *MerchantService) CreateMerchant(
	ctx context.Context,
	params sqlc.CreateMerchantParams,
) error {
	_, err := s.queries.CreateMerchant(ctx, params)
	return err
}

// Get merchant by ID
func (s *MerchantService) GetMerchant(
	ctx context.Context,
	id int64,
) (sqlc.Merchant, error) {
	return s.queries.GetMerchant(ctx, id)
}

// Get all merchants
func (s *MerchantService) ListMerchants(
	ctx context.Context,
) ([]sqlc.Merchant, error) {
	return s.queries.ListMerchants(ctx)
}

// Update merchant
func (s *MerchantService) UpdateMerchant(
	ctx context.Context,
	params sqlc.UpdateMerchantParams,
) error {
	return s.queries.UpdateMerchant(ctx, params)
}

// Delete merchant
func (s *MerchantService) DeleteMerchant(
	ctx context.Context,
	id int64,
) error {
	return s.queries.DeleteMerchant(ctx, id)
}