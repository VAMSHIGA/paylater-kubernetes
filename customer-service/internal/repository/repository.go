// Package repository is the data-access layer for Customer Service (customer_db).
//
// It wraps SQLC-generated CreateCustomer and ListCustomers queries so handlers
// and services remain free of embedded SQL.
package repository

import (
	"context"
	"database/sql"

	"paylater/customer-service/db/sqlc"
)

// Repository wraps SQLC queries for customer persistence.
type Repository struct {
	queries *sqlc.Queries
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
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
