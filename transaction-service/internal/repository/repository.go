// Package repository is the data-access layer for Transaction Service (transaction_db).
package repository

import (
	"database/sql"

	"paylater/transaction-service/db/sqlc"
)

// Repository wraps SQLC queries for transaction persistence.
type Repository struct {
	queries       *sqlc.Queries
	db            *sql.DB
	customerDB    string
	merchantDB    string
	transactionDB string
	paybackDB     string
}

// New creates a Repository from a database connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
		db:      db,
	}
}
