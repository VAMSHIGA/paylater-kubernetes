package services

import (
	"context"

	"paylater/db/sqlc"
)

// MerchantService contains the business logic
// related to merchants.
type MerchantService struct {
	queries *sqlc.Queries
}

// NewMerchantService creates a new MerchantService.
//
// The SQLC Queries object is passed here so the
// service can communicate with the MySQL database.
func NewMerchantService(queries *sqlc.Queries) *MerchantService {
	return &MerchantService{
		queries: queries,
	}
}

// ==========================================================
// Create Merchant
// ==========================================================

// CreateMerchant creates/onboards a new merchant.
//
// The merchant information comes from the handler
// and is passed to the SQLC CreateMerchant query.
func (s *MerchantService) CreateMerchant(
	ctx context.Context,
	params sqlc.CreateMerchantParams,
) error {

	// Call the SQLC generated CreateMerchant function.
	_, err := s.queries.CreateMerchant(ctx, params)

	// If MySQL returns an error, send it back
	// to the handler.
	if err != nil {
		return err
	}

	return nil
}

// ==========================================================
// Update Merchant Commission
// ==========================================================

// UpdateMerchantCommission updates only the commission
// percentage of an existing merchant.
//
// Example:
// Merchant ID = 1
// Old commission = 5%
// New commission = 7%
func (s *MerchantService) UpdateMerchantCommission(
	ctx context.Context,
	params sqlc.UpdateMerchantCommissionParams,
) error {

	// Call the SQLC generated query.
	err := s.queries.UpdateMerchantCommission(ctx, params)

	// Return the error if the database update fails.
	if err != nil {
		return err
	}

	return nil
}