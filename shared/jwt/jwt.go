// Package jwt implements HS256 JWT creation and validation for PayLater.
//
// Identity Service uses GenerateToken after successful login. All protected
// services validate tokens via middleware, which calls ValidateToken.
// Claims carry user_id, email, and role so AuthorizeRoles can enforce access
// without additional database lookups.
//
// Tokens expire after JWTExpiryHours (24h) and must be signed with JWT_SECRET,
// which must be identical across Identity and every validating service.
package jwt

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
)

// Claims represents the information stored inside a PayLater JWT.
type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`

	jwt.RegisteredClaims
}

// GenerateToken creates a signed JWT after successful login.
//
// Signing method is HS256. Expiry and issued-at timestamps use the shared
// JWTExpiryHours constant. Returns ErrJWTSecretNotConfigured when JWT_SECRET
// is missing from the environment.
func GenerateToken(userID int64, email, role string) (string, error) {
	secret := os.Getenv(constants.EnvJWTSecret)

	if secret == "" {
		return "", platformerrors.ErrJWTSecretNotConfigured
	}

	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(
				time.Now().Add(time.Duration(constants.JWTExpiryHours) * time.Hour),
			),
			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(secret))
}

// ValidateToken parses and validates a JWT, returning its claims when valid.
//
// Rejects unexpected signing methods, expired tokens, and malformed claims.
// Used by AuthMiddleware on every protected request.
func ValidateToken(tokenString string) (*Claims, error) {
	secret := os.Getenv(constants.EnvJWTSecret)

	if secret == "" {
		return nil, platformerrors.ErrJWTSecretNotConfigured
	}

	parsedToken, err := jwt.ParseWithClaims(
		tokenString,
		&Claims{},
		func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, platformerrors.ErrUnexpectedSigningMethod
			}

			return []byte(secret), nil
		},
	)

	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(*Claims)

	if !ok || !parsedToken.Valid {
		return nil, platformerrors.ErrInvalidToken
	}

	return claims, nil
}
