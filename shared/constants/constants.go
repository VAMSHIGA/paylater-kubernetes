// Package constants centralizes shared string literals for PayLater services.
//
// Keeping roles, headers, context keys, and env names in one place prevents
// typos across middleware and routers and keeps JWT/context contracts aligned.
package constants

// HTTP header names used by authentication middleware.
const (
	HeaderAuthorization = "Authorization"
)

// BearerPrefix is the expected Authorization scheme for JWTs.
const BearerPrefix = "Bearer"

// Gin context keys populated by AuthMiddleware after successful JWT validation.
const (
	ContextKeyUserID = "user_id"
	ContextKeyEmail  = "email"
	ContextKeyRole   = "role"
)

// User roles embedded in JWT claims and checked by AuthorizeRoles.
const (
	RoleAdmin    = "admin"
	RoleCustomer = "customer"
	RoleMerchant = "merchant"
)

// Environment variable names read by shared/config.Load.
const (
	EnvHTTPPort   = "HTTP_PORT"
	EnvDBHost     = "DB_HOST"
	EnvDBPort     = "DB_PORT"
	EnvDBUser     = "DB_USER"
	EnvDBPassword = "DB_PASSWORD"
	EnvDBName     = "DB_NAME"
	EnvJWTSecret  = "JWT_SECRET"
)

// DateLayoutYYYYMMDD is the Go reference layout for API date fields (YYYY-MM-DD).
const DateLayoutYYYYMMDD = "2006-01-02"

// JWTExpiryHours is the default access-token lifetime after login.
const JWTExpiryHours = 24
