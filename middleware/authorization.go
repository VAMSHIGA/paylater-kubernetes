package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ==========================================================
// Role Authorization Middleware
// ==========================================================
// AuthorizeRoles checks whether the logged-in user has
// permission to access a particular API.
//
// Authentication answers:
//
//	"Who is the user?"
//
// Authorization answers:
//
//	"Is this user allowed to access this API?"
//
// Example:
//
//	AuthorizeRoles("admin")
//
// Only users with the "admin" role can continue.
//
// Another example:
//
//	AuthorizeRoles("admin", "merchant")
//
// Both admin and merchant users can continue.
func AuthorizeRoles(allowedRoles ...string) gin.HandlerFunc {

	return func(c *gin.Context) {

		// ==================================================
		// STEP 1: Get Role From Gin Context
		// ==================================================
		// AuthMiddleware already validated the JWT and stored:
		//
		// user_id
		// email
		// role
		//
		// Here we retrieve the role.
		roleValue, exists := c.Get("role")

		// If role does not exist, authorization cannot continue.
		if !exists {

			c.JSON(http.StatusForbidden, gin.H{
				"error": "User role not found",
			})

			c.Abort()
			return
		}

		// ==================================================
		// STEP 2: Convert Role To String
		// ==================================================
		role, ok := roleValue.(string)

		if !ok {

			c.JSON(http.StatusForbidden, gin.H{
				"error": "Invalid user role",
			})

			c.Abort()
			return
		}

		// ==================================================
		// STEP 3: Check Allowed Roles
		// ==================================================
		// Example:
		//
		// User role:
		//     merchant
		//
		// Allowed roles:
		//     admin
		//     merchant
		//
		// merchant matches → access allowed.
		for _, allowedRole := range allowedRoles {

			if role == allowedRole {

				// Role is allowed.
				// Continue to the next middleware/handler.
				c.Next()
				return
			}
		}

		// ==================================================
		// STEP 4: Access Denied
		// ==================================================
		// The user has a valid JWT, but their role does
		// not have permission to access this API.
		//
		// HTTP 403 = Forbidden.
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You are not authorized to access this resource",
		})

		c.Abort()
	}
}
