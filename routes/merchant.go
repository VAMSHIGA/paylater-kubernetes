package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
	"paylater/middleware"
)

// ==========================================================
// Merchant Routes
// ==========================================================
// RegisterMerchantRoutes registers all merchant-related APIs.
//
// These APIs are protected using:
//
// 1. AuthMiddleware()
//    Checks whether the request contains a valid JWT.
//
// 2. AuthorizeRoles("admin")
//    Checks whether the logged-in user has admin permission.
//
// Request Flow:
//
// Request
//    ↓
// AuthMiddleware()
//    ↓
// AuthorizeRoles("admin")
//    ↓
// Merchant Handler
//
func RegisterMerchantRoutes(
	router *gin.Engine,
	handler *handlers.MerchantHandler,
) {

	// ======================================================
	// Create / Onboard Merchant
	// ======================================================
	// API:
	//
	// POST /merchants
	//
	// Purpose:
	// Creates/onboards a new merchant in PayLater.
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	// Flow:
	//
	// POST /merchants
	//       ↓
	// Check JWT
	//       ↓
	// Check admin role
	//       ↓
	// CreateMerchant Handler
	//
	router.POST(
		"/merchants",

		// Authentication:
		// Check whether JWT token is valid.
		middleware.AuthMiddleware(),

		// Authorization:
		// Only admin users can create merchants.
		middleware.AuthorizeRoles("admin"),

		// Call merchant handler.
		handler.CreateMerchant,
	)

	// ======================================================
	// Update Merchant Commission
	// ======================================================
	// API:
	//
	// PUT /merchants/:id
	//
	// Example:
	//
	// PUT /merchants/1
	//
	// Purpose:
	// Updates the commission for an existing merchant.
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	// Flow:
	//
	// PUT /merchants/1
	//       ↓
	// Check JWT
	//       ↓
	// Check admin role
	//       ↓
	// UpdateMerchantCommission Handler
	//
	router.PUT(
		"/merchants/:id",

		// Authentication:
		// Validate JWT token.
		middleware.AuthMiddleware(),

		// Authorization:
		// Only admin users can update commission.
		middleware.AuthorizeRoles("admin"),

		// Call merchant handler.
		handler.UpdateMerchantCommission,
	)
}
