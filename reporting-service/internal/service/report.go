// Package service implements report aggregations over report_db.
//
// Queries join snapshot copies of customers, merchants, transactions, and
// paybacks. Before each report query the service refreshes the snapshot from
// domain databases so report_db reflects current microservice data.
package service

import (
	"context"
	"database/sql"
	"log"

	"paylater/reporting-service/db/sqlc"
	"paylater/reporting-service/internal/repository"
	"paylater/reporting-service/internal/sync"
)

// ReportService runs report aggregations against the report_db snapshot.
// It refreshes the snapshot from domain databases before each query so reports
// reflect the latest microservice data.
type ReportService struct {
	repo    *repository.Repository
	db      *sql.DB
	sources sync.SourceDBs
}

// NewReportService creates a ReportService wired to the repository and database.
// The database handle is also used for snapshot refresh across domain databases.
func NewReportService(repo *repository.Repository, db *sql.DB) *ReportService {
	return &ReportService{
		repo:    repo,
		db:      db,
		sources: sync.SourceDBsFromEnv(),
	}
}

func (s *ReportService) refreshSnapshot(ctx context.Context) error {
	if err := sync.RefreshSnapshot(ctx, s.db, s.sources); err != nil {
		log.Printf("report service: snapshot refresh failed: %v", err)
		return err
	}
	return nil
}

// GetMerchantFee returns merchant names and commissions.
func (s *ReportService) GetMerchantFee(
	ctx context.Context,
) ([]sqlc.GetMerchantFeeRow, error) {
	if err := s.refreshSnapshot(ctx); err != nil {
		return nil, err
	}
	return s.repo.GetMerchantFee(ctx)
}

// GetCustomerDues returns customer transaction, repayment and remaining due information.
func (s *ReportService) GetCustomerDues(
	ctx context.Context,
) ([]sqlc.GetCustomerDuesRow, error) {
	if err := s.refreshSnapshot(ctx); err != nil {
		return nil, err
	}
	return s.repo.GetCustomerDues(ctx)
}

// GetUsersAtCreditLimit returns customers who reached or exceeded their credit limit.
func (s *ReportService) GetUsersAtCreditLimit(
	ctx context.Context,
) ([]sqlc.GetUsersAtCreditLimitRow, error) {
	if err := s.refreshSnapshot(ctx); err != nil {
		return nil, err
	}
	return s.repo.GetUsersAtCreditLimit(ctx)
}

// GetTotalDues returns total remaining dues (interface{} from SQLC).
func (s *ReportService) GetTotalDues(
	ctx context.Context,
) (interface{}, error) {
	if err := s.refreshSnapshot(ctx); err != nil {
		return nil, err
	}
	return s.repo.GetTotalDues(ctx)
}
