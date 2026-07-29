package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/db"
	"paylater/db/sqlc"
	"paylater/handlers"
	"paylater/routes"
	"paylater/services"
)

func main() {

	// ==========================================================
	// STEP 1: Connect to MySQL Database
	// ==========================================================
	// ConnectDB() creates the connection between
	// our Go application and the MySQL database.
	//
	// All SQLC queries will use this database connection.
	conn, err := db.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}

	// Close the database connection when the application stops.
	defer conn.Close()

	// ==========================================================
	// STEP 2: Create SQLC Query Object
	// ==========================================================
	// sqlc.New(conn) creates the SQLC Queries object.
	//
	// This object contains generated database functions such as:
	//
	// CreateUser()
	// GetUserByEmail()
	// CreateCustomer()
	// CreateMerchant()
	// CreateTransaction()
	// CreatePayback()
	// Report queries
	//
	// The same Queries object is shared by all services.
	queries := sqlc.New(conn)

	// ==========================================================
	// STEP 3: Create Authentication Service
	// ==========================================================
	// AuthService contains authentication business logic.
	//
	// Responsibilities:
	//
	// REGISTER:
	// - Receive email, password and role
	// - Hash password using bcrypt
	// - Store user using SQLC
	//
	// LOGIN:
	// - Find user by email
	// - Compare password with bcrypt hash
	// - Generate JWT token
	authService := services.NewAuthService(
		queries,
	)

	// ==========================================================
	// STEP 4: Create Customer Service
	// ==========================================================
	// CustomerService contains customer-related
	// business logic.
	customerService := services.NewCustomerService(
		queries,
	)

	// ==========================================================
	// STEP 5: Create Merchant Service
	// ==========================================================
	// MerchantService contains merchant-related
	// business logic.
	merchantService := services.NewMerchantService(
		queries,
	)

	// ==========================================================
	// STEP 6: Create Transaction Service
	// ==========================================================
	// TransactionService handles PayLater purchases.
	transactionService := services.NewTransactionService(
		queries,
	)

	// ==========================================================
	// STEP 7: Create Payback Service
	// ==========================================================
	// PaybackService handles customer repayments.
	paybackService := services.NewPaybackService(
		queries,
	)

	// ==========================================================
	// STEP 8: Create Report Service
	// ==========================================================
	// ReportService handles report-related business logic.
	//
	// Reports:
	//
	// - Merchant fees
	// - Customer dues
	// - Customers at credit limit
	// - Total dues
	reportService := services.NewReportService(
		queries,
	)

	// ==========================================================
	// STEP 9: Create Authentication Handler
	// ==========================================================
	// AuthHandler receives authentication HTTP requests.
	//
	// It handles:
	//
	// POST /auth/register
	// POST /auth/login
	//
	// AuthHandler calls AuthService.
	authHandler := handlers.NewAuthHandler(
		authService,
	)

	// ==========================================================
	// STEP 10: Create Customer Handler
	// ==========================================================
	// CustomerHandler receives customer HTTP requests
	// and calls CustomerService.
	customerHandler := handlers.NewCustomerHandler(
		customerService,
	)

	// ==========================================================
	// STEP 11: Create Merchant Handler
	// ==========================================================
	// MerchantHandler receives merchant HTTP requests
	// and calls MerchantService.
	merchantHandler := handlers.NewMerchantHandler(
		merchantService,
	)

	// ==========================================================
	// STEP 12: Create Transaction Handler
	// ==========================================================
	// TransactionHandler receives transaction HTTP requests
	// and calls TransactionService.
	transactionHandler := handlers.NewTransactionHandler(
		transactionService,
	)

	// ==========================================================
	// STEP 13: Create Payback Handler
	// ==========================================================
	// PaybackHandler receives repayment HTTP requests
	// and calls PaybackService.
	paybackHandler := handlers.NewPaybackHandler(
		paybackService,
	)

	// ==========================================================
	// STEP 14: Create Report Handler
	// ==========================================================
	// ReportHandler receives report HTTP requests
	// and calls ReportService.
	reportHandler := handlers.NewReportHandler(
		reportService,
	)

	// ==========================================================
	// STEP 15: Create Gin Router
	// ==========================================================
	// gin.Default() creates the Gin HTTP router.
	//
	// It automatically includes:
	//
	// - Logger middleware
	// - Recovery middleware
	router := gin.Default()

	// ==========================================================
	// STEP 16: Register Authentication Routes
	// ==========================================================
	//
	// These routes are PUBLIC.
	//
	// A JWT is not required because the user needs
	// these APIs before they have a JWT.
	//
	// POST /auth/register
	// Creates a new user account.
	//
	// POST /auth/login
	// Verifies credentials and returns a JWT.
	routes.AuthRoutes(
		router,
		authHandler,
	)

	// ==========================================================
	// STEP 17: Register Customer Routes
	// ==========================================================
	//
	// POST /customers
	// Creates a customer.
	//
	// GET /customers
	// Returns customers.
	routes.CustomerRoutes(
		router,
		customerHandler,
	)

	// ==========================================================
	// STEP 18: Register Merchant Routes
	// ==========================================================
	//
	// POST /merchants
	// Creates/onboards a merchant.
	//
	// PUT /merchants/:id
	// Updates merchant commission.
	routes.RegisterMerchantRoutes(
		router,
		merchantHandler,
	)

	// ==========================================================
	// STEP 19: Register Transaction Routes
	// ==========================================================
	//
	// POST /transactions
	// Creates a PayLater purchase transaction.
	routes.TransactionRoutes(
		router,
		transactionHandler,
	)

	// ==========================================================
	// STEP 20: Register Payback Routes
	// ==========================================================
	//
	// POST /paybacks
	// Records a customer repayment.
	routes.PaybackRoutes(
		router,
		paybackHandler,
	)

	// ==========================================================
	// STEP 21: Register Report Routes
	// ==========================================================
	//
	// GET /reports/merchant-fees
	//
	// GET /reports/customer-dues
	//
	// GET /reports/credit-limit
	//
	// GET /reports/total-dues
	routes.ReportRoutes(
		router,
		reportHandler,
	)

	// ==========================================================
	// STEP 22: Start HTTP Server
	// ==========================================================
	//
	// Application URL:
	//
	// http://localhost:8080
	//
	// ==========================================================
	// AUTHENTICATION
	// ==========================================================
	//
	// POST /auth/register
	// POST /auth/login
	//
	// ==========================================================
	// CUSTOMER
	// ==========================================================
	//
	// POST /customers
	// GET  /customers
	//
	// ==========================================================
	// MERCHANT
	// ==========================================================
	//
	// POST /merchants
	// PUT  /merchants/:id
	//
	// ==========================================================
	// TRANSACTION
	// ==========================================================
	//
	// POST /transactions
	//
	// ==========================================================
	// PAYBACK
	// ==========================================================
	//
	// POST /paybacks
	//
	// ==========================================================
	// REPORTS
	// ==========================================================
	//
	// GET /reports/merchant-fees
	// GET /reports/customer-dues
	// GET /reports/credit-limit
	// GET /reports/total-dues
	//
	// Total APIs after adding authentication:
	//
	// Existing APIs       = 10
	// Authentication APIs = 2
	// Total               = 12

	log.Println("🚀 PayLater API started on :8080")

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
