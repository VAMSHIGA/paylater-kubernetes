// Package service implements report aggregations over report_db.
//
// Queries join snapshot copies of customers, merchants, transactions, and
// paybacks. The snapshot is refreshed on service startup and on a background
// schedule; report handlers read from report_db only.
package service

import (
	"context"

	"paylater/reporting-service/db/sqlc"
	"paylater/reporting-service/internal/repository"
)

// ReportService runs report aggregations against the report_db snapshot.
type ReportService struct {
	repo *repository.Repository
}

// NewReportService creates a ReportService wired to the repository.
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
