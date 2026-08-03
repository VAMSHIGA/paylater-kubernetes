// Package service implements report aggregations over report_db.
//
// Queries join snapshot copies of customers, merchants, transactions, and
// paybacks. The service does not write domain data; it only reads the
// reporting read model documented in docs/DATABASE_OWNERSHIP.md.
package service

import (
	"context"

	"paylater/reporting-service/db/sqlc"
	"paylater/reporting-service/internal/repository"
)

// ReportService connects the report handlers with SQLC database queries.
type ReportService struct {
	repo *repository.Repository
}

// NewReportService creates a new ReportService.
func NewReportService(repo *repository.Repository) *ReportService {
	return &ReportService{
		repo: repo,
	}
}

// GetMerchantFee returns merchant names and commissions.
func (s *ReportService) GetMerchantFee(
	ctx context.Context,
) ([]sqlc.GetMerchantFeeRow, error) {

	return s.repo.GetMerchantFee(ctx)
}

// GetCustomerDues returns customer transaction, repayment and remaining due information.
func (s *ReportService) GetCustomerDues(
	ctx context.Context,
) ([]sqlc.GetCustomerDuesRow, error) {

	return s.repo.GetCustomerDues(ctx)
}

// GetUsersAtCreditLimit returns customers who reached or exceeded their credit limit.
func (s *ReportService) GetUsersAtCreditLimit(
	ctx context.Context,
) ([]sqlc.GetUsersAtCreditLimitRow, error) {

	return s.repo.GetUsersAtCreditLimit(ctx)
}

// GetTotalDues returns total remaining dues (interface{} from SQLC).
func (s *ReportService) GetTotalDues(
	ctx context.Context,
) (interface{}, error) {

	return s.repo.GetTotalDues(ctx)
}
