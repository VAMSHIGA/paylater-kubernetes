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

	// ========================================
	// 1. Connect to MySQL Database
	// ========================================
	// ConnectDB() opens the connection
	// between our Go application and MySQL.
	conn, err := db.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}

	// Close database connection when
	// the application stops.
	defer conn.Close()

	// ========================================
	// 2. Create SQLC Queries
	// ========================================
	// SQLC generated functions use this
	// database connection to execute SQL.
	queries := sqlc.New(conn)

	// ========================================
	// 3. Create Services
	// ========================================
	// Services contain application logic
	// and communicate with SQLC queries.

	// Customer Service
	customerService := services.NewCustomerService(queries)

	// Merchant Service
	merchantService := services.NewMerchantService(queries)

	// Transaction Service
	transactionService := services.NewTransactionService(queries)

	// Payback Service
	paybackService := services.NewPaybackService(queries)

	// Report Service
	reportService := services.NewReportService(queries)

	// ========================================
	// 4. Create Handlers
	// ========================================
	// Handlers receive HTTP requests
	// and call the appropriate service.

	// Customer Handler
	customerHandler := handlers.NewCustomerHandler(
		customerService,
	)

	// Merchant Handler
	merchantHandler := handlers.NewMerchantHandler(
		merchantService,
	)

	// Transaction Handler
	transactionHandler := handlers.NewTransactionHandler(
		transactionService,
	)

	// Payback Handler
	paybackHandler := handlers.NewPaybackHandler(
		paybackService,
	)

	// Report Handler
	reportHandler := handlers.NewReportHandler(
		reportService,
	)

	// ========================================
	// 5. Create Gin Router
	// ========================================
	// Gin Router receives incoming API requests.
	router := gin.Default()

	// ========================================
	// 6. Register Customer Routes
	// ========================================
	routes.CustomerRoutes(
		router,
		customerHandler,
	)

	// Customer APIs:
	// POST   /customers
	// GET    /customers
	// GET    /customers/:id
	// PUT    /customers/:id
	// DELETE /customers/:id

	// ========================================
	// 7. Register Merchant Routes
	// ========================================
	routes.RegisterMerchantRoutes(
		router,
		merchantHandler,
	)

	// Merchant APIs:
	// POST   /merchants
	// GET    /merchants
	// GET    /merchants/:id
	// PUT    /merchants/:id
	// DELETE /merchants/:id

	// ========================================
	// 8. Register Transaction Routes
	// ========================================
	routes.TransactionRoutes(
		router,
		transactionHandler,
	)

	// Transaction APIs:
	// POST   /transactions
	// GET    /transactions
	// GET    /transactions/:id
	// PUT    /transactions/:id
	// DELETE /transactions/:id

	// ========================================
	// 9. Register Payback Routes
	// ========================================
	routes.PaybackRoutes(
		router,
		paybackHandler,
	)

	// Payback APIs:
	// POST   /paybacks
	// GET    /paybacks
	// GET    /paybacks/:id
	// DELETE /paybacks/:id

	// ========================================
	// 10. Register Report Routes
	// ========================================
	routes.ReportRoutes(
		router,
		reportHandler,
	)

	// Report APIs:
	// GET /reports/merchant-fees
	// GET /reports/customer-dues
	// GET /reports/credit-limit
	// GET /reports/total-dues

	// ========================================
	// 11. Start Gin Server
	// ========================================
	// Application runs on:
	// http://localhost:8080
	log.Println("🚀 Server started on :8080")

	err = router.Run(":8080")
	if err != nil {
		log.Fatal(err)
	}
}
