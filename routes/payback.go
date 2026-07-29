package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
	"paylater/middleware"
)

// ==========================================================
// Payback Routes
// ==========================================================
// PaybackRoutes registers all payback-related APIs.
//
// Payback APIs are protected using:
//
// 1. AuthMiddleware()
//    Checks whether the request contains a valid JWT.
//
// 2. AuthorizeRoles("admin", "customer")
//    Allows admin and customer users.
//
// Request Flow:
//
// Request
//    ↓
// AuthMiddleware()
//    ↓
// AuthorizeRoles()
//    ↓
// Payback Handler
//    ↓
// Payback Service
//    ↓
// SQLC
//    ↓
// MySQL
//
func PaybackRoutes(
	router *gin.Engine,
	handler *handlers.PaybackHandler,
) {

	// ======================================================
	// Create Payback
	// ======================================================
	// API:
	//
	// POST /paybacks
	//
	// Purpose:
	// Creates a repayment when a customer pays back
	// an amount they owe.
	//
	// Example:
	//
	// Customer purchased: 500.00
	// Customer pays back: 500.00
	//
	// Security:
	//
	// JWT Required  : YES
	// Allowed Roles : admin, customer
	//
	// Flow:
	//
	// POST /paybacks
	//       ↓
	// Check JWT
	//       ↓
	// Check Role
	//       ↓
	// CreatePayback Handler
	//
	router.POST(
		"/paybacks",

		// ==================================================
		// Authentication
		// ==================================================
		// Check the JWT received in:
		//
		// Authorization: Bearer <JWT_TOKEN>
		//
		// Invalid or missing JWT:
		// HTTP 401 Unauthorized
		middleware.AuthMiddleware(),

		// ==================================================
		// Authorization
		// ==================================================
		// Only these roles can create a payback:
		//
		// admin
		// customer
		//
		// Valid JWT but wrong role:
		// HTTP 403 Forbidden
		middleware.AuthorizeRoles(
			"admin",
			"customer",
		),

		// ==================================================
		// Handler
		// ==================================================
		// If authentication and authorization succeed,
		// execute CreatePayback().
		handler.CreatePayback,
	)
}
