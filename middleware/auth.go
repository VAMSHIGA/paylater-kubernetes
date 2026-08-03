// Package middleware is the legacy monolith JWT auth and role-check layer.
//
// After the strangler migration, protected routes live on microservices that
// use paylater/shared/middleware. The gateway proxies requests without running
// these handlers. Kept temporarily for reference and any leftover local routes;
// new code should import the shared middleware package.
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"paylater/token"
)

// ==========================================================
// JWT Authentication Middleware
// ==========================================================
// AuthMiddleware protects APIs that require login.
//
// Every protected request must contain:
//
// Authorization: Bearer <JWT_TOKEN>
//
// Example:
//
// GET /reports/customer-dues
//
// Header:
//
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//
// Flow:
//
// Client/Postman
//
//	↓
//
// Authorization Header
//
//	↓
//
// AuthMiddleware
//
//	↓
//
// Validate JWT
//
//	↓
//
// Valid?
//
//	YES → Continue to Handler
//	NO  → Return 401 Unauthorized
func AuthMiddleware() gin.HandlerFunc {
// this fun gin run when request is received this function runs when Gin receives a request for a route using that middleware.
	return func(c *gin.Context) {

		// ==================================================
		// STEP 1: Get Authorization Header
		// ==================================================
		// Read the Authorization header from the request.
		//
		// Expected:
		//
		// Authorization: Bearer <JWT_TOKEN>
		//
		authHeader := c.GetHeader("Authorization")

		// If Authorization header is missing,
		// the user is not authenticated.
		if authHeader == "" {

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})

			// Stop the request.
			c.Abort()
			return
		}

		// ==================================================
		// STEP 2: Split Bearer Token
		// ==================================================
		// Example header:
		//
		// Bearer abc123xyz
		//
		// strings.Fields() converts it into:
		//
		// ["Bearer", "abc123xyz"]
		//
		parts := strings.Fields(authHeader)

		// We expect exactly two parts:
		//
		// parts[0] = Bearer
		// parts[1] = JWT token
		//
		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") {

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header must use Bearer token",
			})

			c.Abort()
			return
		}

		// ==================================================
		// STEP 3: Get JWT Token
		// ==================================================
		tokenString := parts[1]

		// ==================================================
		// STEP 4: Validate JWT
		// ==================================================
		// ValidateToken() checks:
		//
		// - JWT signature
		// - JWT expiration
		// - JWT structure
		//
		claims, err := token.ValidateToken(tokenString)

		if err != nil {

			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})

			c.Abort()
			return
		}

		// ==================================================
		// STEP 5: Store User Information
		// ==================================================
		// The JWT contains:
		//
		// user_id
		// email
		// role
		//
		// We store these values inside Gin Context.
		//
		// Other middleware and handlers can access them later.
		//
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)

		// ==================================================
		// STEP 6: Continue Request
		// ==================================================
		// JWT is valid, so allow the request to continue
		// to the next middleware or handler.
		//
		c.Next()
	}
}
