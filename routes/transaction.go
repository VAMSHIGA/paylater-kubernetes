package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
)

// TransactionRoutes registers all transaction endpoints
func TransactionRoutes(
	router *gin.Engine,
	handler *handlers.TransactionHandler,
) {
	// Create transaction
	router.POST("/transactions", handler.CreateTransaction)

	// Get all transactions
	router.GET("/transactions", handler.ListTransactions)

	// Get transaction by ID
	router.GET("/transactions/:id", handler.GetTransaction)

	// Update transaction
	router.PUT("/transactions/:id", handler.UpdateTransaction)

	// Delete transaction
	router.DELETE("/transactions/:id", handler.DeleteTransaction)
}