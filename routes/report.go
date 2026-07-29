package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
	"paylater/middleware"
)

// ==========================================================
// Report Routes
// ==========================================================
// ReportRoutes registers all report-related APIs.
//
// Report APIs contain important system information such as:
//
// - Merchant fees
// - Customer dues
// - Customers at credit limit
// - Total dues
//
// Therefore, these APIs are protected using:
//
// 1. AuthMiddleware()
//    Checks whether the request contains a valid JWT.
//
// 2. AuthorizeRoles("admin")
//    Allows only admin users to access reports.
//
// Request Flow:
//
// Request
//    ↓
// AuthMiddleware()
//    ↓
// AuthorizeRoles("admin")
//    ↓
// Report Handler
//    ↓
// Report Service
//    ↓
// SQLC
//    ↓
// MySQL
//
func ReportRoutes(
	router *gin.Engine,
	handler *handlers.ReportHandler,
) {

	// ======================================================
	// 1. Get Merchant Fees
	// ======================================================
	// API:
	//
	// GET /reports/merchant-fees
	//
	// Purpose:
	// Returns merchant names and their commission information.
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	router.GET(
		"/reports/merchant-fees",

		// Check JWT token.
		middleware.AuthMiddleware(),

		// Only admin can access this report.
		middleware.AuthorizeRoles("admin"),

		// Call Report Handler.
		handler.GetMerchantFee,
	)

	// ======================================================
	// 2. Get Customer Dues
	// ======================================================
	// API:
	//
	// GET /reports/customer-dues
	//
	// Purpose:
	// Shows:
	//
	// - Customer
	// - Total transaction amount
	// - Total amount repaid
	// - Remaining due
	//
	// Formula:
	//
	// Remaining Due =
	// Total Transactions - Total Paybacks
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	router.GET(
		"/reports/customer-dues",

		// Validate JWT.
		middleware.AuthMiddleware(),

		// Check admin role.
		middleware.AuthorizeRoles("admin"),

		// Call Report Handler.
		handler.GetCustomerDues,
	)

	// ======================================================
	// 3. Get Customers At Credit Limit
	// ======================================================
	// API:
	//
	// GET /reports/credit-limit
	//
	// Purpose:
	// Returns customers whose remaining due has reached
	// or exceeded their credit limit.
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	router.GET(
		"/reports/credit-limit",

		// Validate JWT.
		middleware.AuthMiddleware(),

		// Only admin can access.
		middleware.AuthorizeRoles("admin"),

		// Call Report Handler.
		handler.GetUsersAtCreditLimit,
	)

	// ======================================================
	// 4. Get Total Dues
	// ======================================================
	// API:
	//
	// GET /reports/total-dues
	//
	// Purpose:
	// Calculates the total amount still owed by
	// all customers.
	//
	// Formula:
	//
	// Total Dues =
	// Total Transactions - Total Paybacks
	//
	// Security:
	//
	// JWT Required : YES
	// Allowed Role : admin
	//
	router.GET(
		"/reports/total-dues",

		// Validate JWT.
		middleware.AuthMiddleware(),

		// Only admin can access.
		middleware.AuthorizeRoles("admin"),

		// Call Report Handler.
		handler.GetTotalDues,
	)
}
