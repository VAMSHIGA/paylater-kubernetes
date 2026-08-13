// Package repository is the data-access layer for Customer Service (customer_db).
//
// It wraps SQLC-generated CreateCustomer and ListCustomers queries so handlers
// and services remain free of embedded SQL.
package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"

	"paylater/customer-service/db/sqlc"
	"paylater/shared/balance"
)

const (
	envIdentityDB     = "IDENTITY_DB"
	defaultIdentityDB = "identity_db"
)

// Repository wraps SQLC queries for customer persistence.
type Repository struct {
	queries    *sqlc.Queries
	db         *sql.DB
	identityDB string
	balanceDBs balance.DatabaseNames
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	identityDB := os.Getenv(envIdentityDB)
	if identityDB == "" {
		identityDB = defaultIdentityDB
	}

	return &Repository{
		queries:    sqlc.New(db),
		db:         db,
		identityDB: identityDB,
		balanceDBs: balance.LoadDatabaseNames(),
	}
}

// CreateCustomer inserts a new customer record.
func (r *Repository) CreateCustomer(
	ctx context.Context,
	params sqlc.CreateCustomerParams,
) (sql.Result, error) {
	return r.queries.CreateCustomer(ctx, params)
}

// ListCustomers returns all customers ordered by id.
func (r *Repository) ListCustomers(
	ctx context.Context,
) ([]sqlc.Customer, error) {
	return r.queries.ListCustomers(ctx)
}

// GetCustomerByUserID returns the customer profile linked to an identity user.
func (r *Repository) GetCustomerByUserID(
	ctx context.Context,
	userID int64,
) (sqlc.Customer, error) {
	return r.queries.GetCustomerByUserID(ctx, sql.NullInt64{
		Int64: userID,
		Valid: true,
	})
}

// LookupCustomerUserIDByEmail returns identity users.id for a customer-role user
// with the given email, when one exists on the shared MySQL server.
func (r *Repository) LookupCustomerUserIDByEmail(
	ctx context.Context,
	email string,
) (sql.NullInt64, error) {
	query := fmt.Sprintf(
		"SELECT id FROM %s.users WHERE email = ? AND role = 'customer' LIMIT 1",
		r.identityDB,
	)

	var userID int64
	err := r.db.QueryRowContext(ctx, query, email).Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		return sql.NullInt64{}, nil
	}
	if err != nil {
		return sql.NullInt64{}, err
	}

	return sql.NullInt64{Int64: userID, Valid: true}, nil
}

// LookupIdentityUserByID returns the email for an identity user.
func (r *Repository) LookupIdentityUserByID(
	ctx context.Context,
	userID int64,
) (string, error) {
	query := fmt.Sprintf(
		"SELECT email FROM %s.users WHERE id = ? AND role = 'customer' LIMIT 1",
		r.identityDB,
	)

	var email string
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&email)
	if err != nil {
		return "", err
	}

	return email, nil
}

// GetCustomerBalance returns outstanding due and available credit for a customer.
func (r *Repository) GetCustomerBalance(
	ctx context.Context,
	customerID int64,
) (balance.CustomerBalanceResult, error) {
	return balance.CustomerBalance(ctx, r.db, r.balanceDBs, customerID)
}
