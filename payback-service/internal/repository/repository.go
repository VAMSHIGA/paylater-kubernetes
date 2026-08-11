// Package repository is the data-access layer for Payback Service (payback_db).
package repository

import (
	"database/sql"

	"paylater/payback-service/db/sqlc"
)

// Repository wraps SQLC queries for payback persistence.
type Repository struct {
	queries       *sqlc.Queries
	db            *sql.DB
	customerDB    string
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
