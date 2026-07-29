package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
	"paylater/middleware"
)

// ==========================================================
// Customer Routes
// ==========================================================
// CustomerRoutes registers all customer-related endpoints.
//
// Customer APIs are protected using:
//
// 1. AuthMiddleware()
//    Checks whether the user has provided a valid JWT token.
//
// 2. AuthorizeRoles("admin")
//    Checks whether the logged-in user has the admin role.
//
// Request flow:
//
// Request
//    ↓
// AuthMiddleware()
//    ↓
// AuthorizeRoles("admin")
//    ↓
// Customer Handler
//
func CustomerRoutes(
	router *gin.Engine,
	handler *handlers.CustomerHandler,
) {

	// ======================================================
	// Create Customer
	// ======================================================
	// API:
	//
	// POST /customers
	//
	// Purpose:
	// Creates a new customer.
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	// Flow:
	//
	// POST /customers
	//       ↓
	// Check JWT
	//       ↓
	// Check admin role
	//       ↓
	// CreateCustomer Handler
	//
	router.POST(
		"/customers",

		// Authentication:
		// Check whether JWT token is valid.
		middleware.AuthMiddleware(),

		// Authorization:
		// Only admin users are allowed.
		middleware.AuthorizeRoles("admin"),

		// If authentication and authorization
		// are successful, call the handler.
		handler.CreateCustomer,
	)

	// ======================================================
	// Get All Customers
	// ======================================================
	// API:
	//
	// GET /customers
	//
	// Purpose:
	// Returns all customers.
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	// Flow:
	//
	// GET /customers
	//      ↓
	// Check JWT
	//      ↓
	// Check admin role
	//      ↓
	// ListCustomers Handler
	//
	router.GET(
		"/customers",

		// Authentication:
		// Check whether JWT token is valid.
		middleware.AuthMiddleware(),

		// Authorization:
		// Only admin users are allowed.
		middleware.AuthorizeRoles("admin"),

		// Call customer handler.
		handler.ListCustomers,
	)
}
