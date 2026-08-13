package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"paylater/merchant-service/db/sqlc"
	"paylater/merchant-service/internal/config"
	"paylater/merchant-service/internal/repository"
	"paylater/shared/merchantauth"
)

var ErrMerchantNotFound = errors.New("merchant not found")

type merchantRepository interface {
	CreateMerchant(ctx context.Context, params sqlc.CreateMerchantParams) (sql.Result, error)
	UpdateMerchantCommission(ctx context.Context, params sqlc.UpdateMerchantCommissionParams) (int64, error)
	GetMerchantByUserID(ctx context.Context, userID int64) (sqlc.Merchant, error)
	GetMerchantByID(ctx context.Context, merchantID int64) (sqlc.Merchant, error)
	LookupIdentityMerchantEmail(ctx context.Context, userID int64) (string, error)
	GetDashboardSummary(ctx context.Context, merchantID int64) (repository.DashboardSummary, error)
	ListRecentTransactions(ctx context.Context, merchantID int64, limit int) ([]repository.DashboardTransaction, error)
}

type MerchantDashboard struct {
	Merchant            sqlc.Merchant
	TotalTransactions   int64
	TotalSales          string
	TotalCommission     string
	MerchantEarnings    string
	PayLaterCommission  string
	RecentTransactions  []repository.DashboardTransaction
}

type MerchantService struct {
	repo               merchantRepository
	defaultCommission  string
}

func NewMerchantService(repo *repository.Repository) *MerchantService {
	return &MerchantService{
		repo:              repo,
		defaultCommission: config.LoadDefaultMerchantCommission(),
	}
}

func (s *MerchantService) CreateMerchant(
	ctx context.Context,
	params sqlc.CreateMerchantParams,
) error {
	_, err := s.repo.CreateMerchant(ctx, params)
	return err
}

func (s *MerchantService) UpdateMerchantCommission(
	ctx context.Context,
	params sqlc.UpdateMerchantCommissionParams,
) error {
	rows, err := s.repo.UpdateMerchantCommission(ctx, params)
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrMerchantNotFound
	}

	return nil
}

func (s *MerchantService) GetMerchantByUserID(
	ctx context.Context,
	userID int64,
) (sqlc.Merchant, error) {
	merchant, err := s.repo.GetMerchantByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return sqlc.Merchant{}, merchantauth.ErrNoLinkedMerchant
		}
		return sqlc.Merchant{}, err
	}

	return merchant, nil
}

func (s *MerchantService) EnsureMerchantProfile(
	ctx context.Context,
	userID int64,
	email string,
) (sqlc.Merchant, error) {
	email = strings.TrimSpace(email)
	if email == "" {
		identityEmail, err := s.repo.LookupIdentityMerchantEmail(ctx, userID)
		if err != nil {
			return sqlc.Merchant{}, err
		}
		email = identityEmail
	}

	params := sqlc.CreateMerchantParams{
		MerchantName: merchantNameFromEmail(email),
		PhoneNumber:  "0000000000",
		Onboarding:   repository.TodayUTC(),
		Commission:   s.defaultCommission,
		UserID: sql.NullInt64{
			Int64: userID,
			Valid: true,
		},
	}

	if err := s.CreateMerchant(ctx, params); err != nil {
		return sqlc.Merchant{}, err
	}

	return s.repo.GetMerchantByUserID(ctx, userID)
}

func (s *MerchantService) GetMyMerchantProfile(
	ctx context.Context,
	userID int64,
	email string,
) (sqlc.Merchant, error) {
	merchant, err := s.repo.GetMerchantByUserID(ctx, userID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return sqlc.Merchant{}, err
		}

		return s.EnsureMerchantProfile(ctx, userID, email)
	}

	return merchant, nil
}

func (s *MerchantService) GetMerchantDashboard(
	ctx context.Context,
	userID int64,
	email string,
) (MerchantDashboard, error) {
	merchant, err := s.GetMyMerchantProfile(ctx, userID, email)
	if err != nil {
		return MerchantDashboard{}, err
	}

	summary, err := s.repo.GetDashboardSummary(ctx, merchant.ID)
	if err != nil {
		return MerchantDashboard{}, err
	}

	recent, err := s.repo.ListRecentTransactions(ctx, merchant.ID, 10)
	if err != nil {
		return MerchantDashboard{}, err
	}

	return MerchantDashboard{
		Merchant:           merchant,
		TotalTransactions:  summary.TotalTransactions,
		TotalSales:         summary.TotalSales,
		TotalCommission:    summary.TotalCommission,
		MerchantEarnings:   summary.MerchantEarnings,
		PayLaterCommission: summary.TotalCommission,
		RecentTransactions: recent,
	}, nil
}

func merchantNameFromEmail(email string) string {
	localPart := strings.Split(email, "@")[0]
	localPart = strings.NewReplacer(".", " ", "_", " ", "-", " ").Replace(localPart)
	localPart = strings.Join(strings.Fields(localPart), " ")

	if localPart == "" {
		return "Merchant"
	}

	return localPart
}
