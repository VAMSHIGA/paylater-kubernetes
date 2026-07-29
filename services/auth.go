package services

import (
	"context"
	"errors"

	"golang.org/x/crypto/bcrypt"

	"paylater/db/sqlc"
	"paylater/token"
)

// AuthService contains authentication business logic.
type AuthService struct {
	queries *sqlc.Queries
}

// NewAuthService creates a new AuthService.
func NewAuthService(queries *sqlc.Queries) *AuthService {
	return &AuthService{
		queries: queries,
	}
}

// Register creates a new user account.
func (s *AuthService) Register(
	ctx context.Context,
	email string,
	password string,
	role string,
) error {

	// Convert plain password into bcrypt hash.
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

	_, err = s.queries.CreateUser(ctx, params)

	return err
}

// Login verifies the user's credentials
// and returns a JWT token.
func (s *AuthService) Login(
	ctx context.Context,
	email string,
	password string,
) (string, error) {

	// Find user by email.
	user, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	// Compare plain password with stored bcrypt hash.
	err = bcrypt.CompareHashAndPassword(
		[]byte(user.PasswordHash),
		[]byte(password),
	)
	if err != nil {
		return "", errors.New("invalid email or password")
	}

	// Generate JWT after successful authentication.
	jwtToken, err := token.GenerateToken(
		user.ID,
		user.Email,
		user.Role,
	)
	if err != nil {
		return "", err
	}

	return jwtToken, nil
}