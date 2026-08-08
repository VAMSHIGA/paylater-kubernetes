// Package service implements Identity authentication business rules.
//
// Register hashes passwords with bcrypt before persisting users. Login compares
// hashes and issues JWTs via shared/jwt so other services can validate tokens
// with the same JWT_SECRET.
package service

import (
	"context"
	"errors"

	"github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"

	"paylater/identity-service/db/sqlc"
	"paylater/identity-service/internal/repository"
	"paylater/shared/jwt"
)

// ErrEmailAlreadyExists is returned when registration uses an email that already exists.
var ErrEmailAlreadyExists = errors.New("email already registered")

// AuthService contains authentication business logic for register and login.
type AuthService struct {
	repo *repository.Repository
}

// NewAuthService creates an AuthService that persists users through repo.
func NewAuthService(repo *repository.Repository) *AuthService {
	return &AuthService{
		repo: repo,
	}
}

// Register hashes the plaintext password and inserts a user into identity_db.
//
// Returns a database error if the insert fails (for example duplicate email).
func (s *AuthService) Register(
	ctx context.Context,
	email string,
	password string,
	role string,
) error {

	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return err
	}

	params := sqlc.CreateUserParams{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         role,
	}

	_, err = s.repo.CreateUser(ctx, params)
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return ErrEmailAlreadyExists
		}
		return err
	}

	return nil
}

// Login loads the user by email, verifies the password hash, and returns a JWT.
//
// Always returns "invalid email or password" on lookup or compare failure to
// avoid leaking whether the account exists.
func (s *AuthService) Login(
	ctx context.Context,
	email string,
	password string,
) (string, error) {

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(password),
	)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	jwtToken, err := jwt.GenerateToken(
		user.ID,
		user.Email,
		user.Role,
	)
	if err != nil {
		return "", err
	}

	return jwtToken, nil
}
