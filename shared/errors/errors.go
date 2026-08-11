// Package errors defines shared sentinel errors whose messages match existing
// PayLater API responses. Services and middleware should reuse these so clients
// continue to see identical error text after shared-platform adoption.
package errors

import "errors"

// Configuration errors returned when a service cannot start safely.
var (
	ErrDatabaseConfigIncomplete = errors.New("database configuration is incomplete")
	ErrJWTSecretNotConfigured   = errors.New("JWT_SECRET is not configured")
)

// JWT errors returned by token parsing and validation.
var (
	ErrUnexpectedSigningMethod = errors.New("unexpected signing method")
	ErrInvalidToken            = errors.New("invalid token")
)

// Authorization errors returned by AuthMiddleware and AuthorizeRoles.
var (
	ErrAuthorizationHeaderRequired     = errors.New("Authorization header is required")
	ErrAuthorizationHeaderBearerToken  = errors.New("Authorization header must use Bearer token")
	ErrInvalidOrExpiredToken           = errors.New("Invalid or expired token")
	ErrUserRoleNotFound                = errors.New("User role not found")
	ErrInvalidUserRole                 = errors.New("Invalid user role")
	ErrNotAuthorized                   = errors.New("You are not authorized to access this resource")
	ErrAdminSelfRegistrationNotAllowed = errors.New("You are not authorized to register as admin")
	ErrCreditLimitExceeded             = errors.New("transaction amount exceeds available credit limit")
	ErrPaybackExceedsRemainingDue      = errors.New("payback amount exceeds remaining due")
	ErrInvalidPaybackAmount            = errors.New("amount must be greater than zero")
)
