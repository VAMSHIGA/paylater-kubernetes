package repository

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	"paylater/merchant-service/db/sqlc"
)

const (
	envIdentityDB      = "IDENTITY_DB"
	envCustomerDB      = "CUSTOMER_DB"
	envTransactionDB   = "TRANSACTION_DB"
	defaultIdentityDB  = "identity_db"
	defaultCustomerDB  = "customer_db"
	defaultTransactionDB = "transaction_db"
)

type Repository struct {
	queries       *sqlc.Queries
	db            *sql.DB
	identityDB    string
	customerDB    string
	transactionDB string
}

func New(db *sql.DB) *Repository {
	identityDB := os.Getenv(envIdentityDB)
	if identityDB == "" {
		identityDB = defaultIdentityDB
	}

	customerDB := os.Getenv(envCustomerDB)
	if customerDB == "" {
		customerDB = defaultCustomerDB
	}

	transactionDB := os.Getenv(envTransactionDB)
	if transactionDB == "" {
		transactionDB = defaultTransactionDB
	}

	return &Repository{
		queries:       sqlc.New(db),
		db:            db,
		identityDB:    identityDB,
		customerDB:    customerDB,
		transactionDB: transactionDB,
	}
}

func (r *Repository) CreateMerchant(
	ctx context.Context,
	params sqlc.CreateMerchantParams,
) (sql.Result, error) {
	return r.queries.CreateMerchant(ctx, params)
}

func (r *Repository) UpdateMerchantCommission(
	ctx context.Context,
	params sqlc.UpdateMerchantCommissionParams,
) (int64, error) {
	return r.queries.UpdateMerchantCommission(ctx, params)
}

func (r *Repository) GetMerchantByUserID(
	ctx context.Context,
	userID int64,
) (sqlc.Merchant, error) {
	return r.queries.GetMerchantByUserID(ctx, sql.NullInt64{
		Int64: userID,
		Valid: true,
	})
}

func (r *Repository) GetMerchantByID(
	ctx context.Context,
	merchantID int64,
) (sqlc.Merchant, error) {
	return r.queries.GetMerchantByID(ctx, merchantID)
}

func (r *Repository) LookupIdentityMerchantEmail(
	ctx context.Context,
	userID int64,
) (string, error) {
	query := fmt.Sprintf(
		"SELECT email FROM %s.users WHERE id = ? AND role = 'merchant' LIMIT 1",
		r.identityDB,
	)

	var email string
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&email)
	if err != nil {
		return "", err
	}

	return email, nil
}

type DashboardSummary struct {
	TotalTransactions int64
	TotalSales        string
	TotalCommission   string
	MerchantEarnings  string
}

type DashboardTransaction struct {
	ID                int64
	CustomerID        int64
	CustomerName      string
	Amount            string
	CommissionAmount  string
	MerchantNetAmount string
	TransactionDate   string
}

func (r *Repository) GetDashboardSummary(
	ctx context.Context,
	merchantID int64,
) (DashboardSummary, error) {
	query := fmt.Sprintf(`
		SELECT
			COUNT(*),
			CAST(COALESCE(SUM(amount), 0) AS CHAR),
			CAST(COALESCE(SUM(commission), 0) AS CHAR),
			CAST(COALESCE(SUM(amount - commission), 0) AS CHAR)
		FROM %s.transactions
		WHERE merchant_id = ?`, r.transactionDB)

	var summary DashboardSummary
	err := r.db.QueryRowContext(ctx, query, merchantID).Scan(
		&summary.TotalTransactions,
		&summary.TotalSales,
		&summary.TotalCommission,
		&summary.MerchantEarnings,
	)
	if err != nil {
		return DashboardSummary{}, err
	}

	return summary, nil
}

func (r *Repository) ListRecentTransactions(
	ctx context.Context,
	merchantID int64,
	limit int,
) ([]DashboardTransaction, error) {
	query := fmt.Sprintf(`
		SELECT
			t.id,
			t.customer_id,
			COALESCE(c.name, ''),
			CAST(t.amount AS CHAR),
			CAST(t.commission AS CHAR),
			CAST((t.amount - t.commission) AS CHAR),
			DATE_FORMAT(t.transaction_date, '%%Y-%%m-%%d')
		FROM %s.transactions t
		LEFT JOIN %s.customers c ON c.id = t.customer_id
		WHERE t.merchant_id = ?
		ORDER BY t.id DESC
		LIMIT ?`, r.transactionDB, r.customerDB)

	rows, err := r.db.QueryContext(ctx, query, merchantID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]DashboardTransaction, 0)
	for rows.Next() {
		var item DashboardTransaction
		if err := rows.Scan(
			&item.ID,
			&item.CustomerID,
			&item.CustomerName,
			&item.Amount,
			&item.CommissionAmount,
			&item.MerchantNetAmount,
			&item.TransactionDate,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func TodayUTC() time.Time {
	now := time.Now().UTC()
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}
