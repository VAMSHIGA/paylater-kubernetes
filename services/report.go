package services

import (
	"context"

	"paylater/db/sqlc"
)

// ========================================
// Report Service
// ========================================
// ReportService connects the report handlers
// with SQLC database queries.
type ReportService struct {
	queries *sqlc.Queries
}

// ========================================
// Create Report Service
// ========================================
func NewReportService(
	queries *sqlc.Queries,
) *ReportService {

	return &ReportService{
		queries: queries,
	}
}

// ========================================
// 1. Get Merchant Fees
// ========================================
// Returns merchant names and commissions.
func (s *ReportService) GetMerchantFee(
	ctx context.Context,
) ([]sqlc.GetMerchantFeeRow, error) {

	return s.queries.GetMerchantFee(ctx)
}

// ========================================
// 2. Get Customer Dues
// ========================================
// Returns customer transaction,
// repayment and remaining due information.
func (s *ReportService) GetCustomerDues(
	ctx context.Context,
) ([]sqlc.GetCustomerDuesRow, error) {

	return s.queries.GetCustomerDues(ctx)
}

// ========================================
// 3. Get Users At Credit Limit
// ========================================
// Returns customers who reached
// or exceeded their credit limit.
func (s *ReportService) GetUsersAtCreditLimit(
	ctx context.Context,
) ([]sqlc.GetUsersAtCreditLimitRow, error) {

	return s.queries.GetUsersAtCreditLimit(ctx)
}

// ========================================
// 4. Get Total Dues
// ========================================
// SQLC currently generates GetTotalDues()
// with interface{} as the return type.
func (s *ReportService) GetTotalDues(
	ctx context.Context,
) (interface{}, error) {

	return s.queries.GetTotalDues(ctx)
}