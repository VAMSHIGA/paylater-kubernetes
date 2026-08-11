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
