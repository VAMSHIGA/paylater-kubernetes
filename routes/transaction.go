package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
	"paylater/middleware"
)

// ==========================================================
// Transaction Routes
// ==========================================================
// TransactionRoutes registers all transaction-related APIs.
//
// Transactions are protected using:
//
// 1. AuthMiddleware()
//    Checks whether the request contains a valid JWT.
//
// 2. AuthorizeRoles("admin", "customer")
//    Allows only admin and customer roles.
//
// Request Flow:
//
// Request
//    ↓
// AuthMiddleware()
//    ↓
// AuthorizeRoles()
//    ↓
// Transaction Handler
//    ↓
// Transaction Service
//    ↓
// SQLC
//    ↓
// MySQL
//
func TransactionRoutes(
	router *gin.Engine,
	handler *handlers.TransactionHandler,
) {

	// ======================================================
	// Create Transaction
	// ======================================================
	// API:
	//
	// POST /transactions
	//
	// Purpose:
	// Creates a new PayLater purchase transaction.
	//
	// Example:
	//
	// Customer purchases something from a merchant
	// using their PayLater credit.
	//
	// Security:
	//
	// JWT Required  : YES
	// Allowed Roles : admin, customer
	//
	// Flow:
	//
	// POST /transactions
	//        ↓
	// Check JWT
	//        ↓
	// Check Role
	//        ↓
	// CreateTransaction Handler
	//
	router.POST(
		"/transactions",

		// Authentication:
		// Validate the JWT from:
		//
		// Authorization: Bearer <token>
		middleware.AuthMiddleware(),

		// Authorization:
		// Admin and customer users are allowed
		// to create transactions.
		middleware.AuthorizeRoles(
			"admin",
			"customer",
		),

		// If authentication and authorization
		// succeed, execute the transaction handler.
		handler.CreateTransaction,
	)
}
