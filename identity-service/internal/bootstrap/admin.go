// Package bootstrap provisions operator-controlled admin accounts outside public HTTP APIs.
package bootstrap

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"

	"paylater/identity-service/db/sqlc"
	"paylater/shared/constants"
)

const minPasswordLength = 6

// ErrAdminUserAlreadyExists is returned when the bootstrap email is already registered.
var ErrAdminUserAlreadyExists = errors.New("admin user already exists")

// ErrInvalidEmail is returned when the bootstrap email is malformed.
var ErrInvalidEmail = errors.New("invalid email")

// ErrInvalidPassword is returned when the bootstrap password is too short.
var ErrInvalidPassword = errors.New("password must be at least 6 characters")

// UserRepository persists bootstrap admin users.
type UserRepository interface {
	GetUserByEmail(ctx context.Context, email string) (sqlc.User, error)
	CreateUser(ctx context.Context, params sqlc.CreateUserParams) (sql.Result, error)
}

// CreateAdmin inserts a new admin user after validating input and checking duplicates.
//
// It never returns or logs the plaintext password.
func CreateAdmin(
	ctx context.Context,
	repo UserRepository,
	email string,
	password string,
) error {
	normalizedEmail, err := normalizeEmail(email)
	if err != nil {
		return err
	}

	if err := validatePassword(password); err != nil {
		return err
	}

	_, err = repo.GetUserByEmail(ctx, normalizedEmail)
	if err == nil {
		return ErrAdminUserAlreadyExists
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	_, err = repo.CreateUser(ctx, sqlc.CreateUserParams{
		Email:        normalizedEmail,
		PasswordHash: string(hashedPassword),
		Role:         constants.RoleAdmin,
	})
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return ErrAdminUserAlreadyExists
		}
		return err
	}

	return nil
}

func normalizeEmail(email string) (string, error) {
	trimmed := strings.TrimSpace(email)
	if trimmed == "" {
		return "", ErrInvalidEmail
	}

	parsed, err := mail.ParseAddress(trimmed)
	if err != nil {
		return "", ErrInvalidEmail
	}

	return strings.ToLower(parsed.Address), nil
}

func validatePassword(password string) error {
	if len(password) < minPasswordLength {
		return ErrInvalidPassword
	}
	return nil
}

// SuccessMessage returns a safe operator message without secrets.
func SuccessMessage(email string) string {
	return fmt.Sprintf("admin user created: %s", email)
}
