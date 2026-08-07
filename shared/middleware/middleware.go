// Package middleware provides Gin authentication and role-based authorization.
//
// Typical route wiring:
//
//	router.POST("/path",
//	    middleware.AuthMiddleware(),
//	    middleware.AuthorizeRoles(constants.RoleAdmin),
//	    handler.Action,
//	)
//
// AuthMiddleware validates the Bearer JWT and stores user_id, email, and role
// on the Gin context. AuthorizeRoles must run after AuthMiddleware and returns
// HTTP 403 when the caller's role is not allowed.
//
// Used by Customer, Merchant, Transaction, Payback, and Reporting services.
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
	"paylater/shared/jwt"
	"paylater/shared/response"
)

// AuthMiddleware protects APIs that require a valid JWT.
//
// Expects header: Authorization: Bearer <token>.
// On success stores claims in Gin context and continues the chain.
// On failure writes 401 JSON and aborts the request.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(constants.HeaderAuthorization)

		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, platformerrors.ErrAuthorizationHeaderRequired.Error())
			c.Abort()
			return
		}

		parts := strings.Fields(authHeader)

		if len(parts) != 2 || !strings.EqualFold(parts[0], constants.BearerPrefix) {
			response.Error(c, http.StatusUnauthorized, platformerrors.ErrAuthorizationHeaderBearerToken.Error())
			c.Abort()
			return
		}

		tokenString := parts[1]

		claims, err := jwt.ValidateToken(tokenString)

		if err != nil {
			response.Error(c, http.StatusUnauthorized, platformerrors.ErrInvalidOrExpiredToken.Error())
			c.Abort()
			return
		}

		c.Set(constants.ContextKeyUserID, claims.UserID)
		c.Set(constants.ContextKeyEmail, claims.Email)
		c.Set(constants.ContextKeyRole, claims.Role)

		c.Next()
	}
}

// AuthorizeRoles checks whether the logged-in user has an allowed role.
//
// Must be registered after AuthMiddleware so the role context key is set.
// Returns HTTP 403 with a stable error message when the role is missing or
// not in allowedRoles.
func AuthorizeRoles(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleValue, exists := c.Get(constants.ContextKeyRole)

		if !exists {
			response.Error(c, http.StatusForbidden, platformerrors.ErrUserRoleNotFound.Error())
			c.Abort()
			return
		}

		role, ok := roleValue.(string)

		if !ok {
			response.Error(c, http.StatusForbidden, platformerrors.ErrInvalidUserRole.Error())
			c.Abort()
			return
		}

		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				c.Next()
				return
			}
		}

		response.Error(c, http.StatusForbidden, platformerrors.ErrNotAuthorized.Error())
		c.Abort()
	}
}
