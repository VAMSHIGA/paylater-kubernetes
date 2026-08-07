// Package repository is the data-access layer for Identity Service.
//
// It wraps SQLC-generated queries against identity_db.users so the service
// layer never embeds raw SQL. Used exclusively by AuthService.
package repository

import (
	"context"
	"database/sql"

	"paylater/identity-service/db/sqlc"
)

// Repository wraps SQLC queries for user persistence in identity_db.
type Repository struct {
	queries *sqlc.Queries
}

// New creates a Repository bound to the given MySQL connection.
func New(db *sql.DB) *Repository {
	return &Repository{
		queries: sqlc.New(db),
	}
}

// CreateUser inserts a new user record (email, password hash, role).
func (r *Repository) CreateUser(
	ctx context.Context,
	params sqlc.CreateUserParams,
) (sql.Result, error) {
	return r.queries.CreateUser(ctx, params)
}

// GetUserByEmail retrieves a user by unique email for login verification.
func (r *Repository) GetUserByEmail(
	ctx context.Context,
	email string,
) (sqlc.User, error) {
	return r.queries.GetUserByEmail(ctx, email)
}
