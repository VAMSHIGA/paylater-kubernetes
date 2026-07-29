package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/db/sqlc"
	"paylater/services"
)

// ==========================================================
// Request Structure
// ==========================================================

// CreateTransactionRequest represents the JSON body
// received when a customer makes a PayLater purchase.
type CreateTransactionRequest struct {
	CustomerID      int64  `json:"customer_id" binding:"required"`
	MerchantID      int64  `json:"merchant_id" binding:"required"`
	Amount          string `json:"amount" binding:"required"`
	Commission      string `json:"commission" binding:"required"`
	TransactionDate string `json:"transaction_date" binding:"required"`
}

// ==========================================================
// Transaction Handler
// ==========================================================

// TransactionHandler handles transaction-related HTTP requests.
type TransactionHandler struct {
	service *services.TransactionService
}

// NewTransactionHandler creates a new TransactionHandler.
func NewTransactionHandler(
	service *services.TransactionService,
) *TransactionHandler {

	return &TransactionHandler{
		service: service,
	}
}

// ==========================================================
// POST /transactions
// ==========================================================

// CreateTransaction creates a new PayLater transaction.
//
// Example request:
//
// {
//     "customer_id": 1,
//     "merchant_id": 1,
//     "amount": "500.00",
//     "commission": "5.00",
//     "transaction_date": "2026-07-29"
// }
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {

	// ------------------------------------------------------
	// STEP 1: Read JSON Request
	// ------------------------------------------------------

	var req CreateTransactionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// ------------------------------------------------------
	// STEP 2: Convert Transaction Date
	// ------------------------------------------------------
	// API receives the date as:
	//
	// "2026-07-29"
	//
	// MySQL DATE is represented by time.Time in SQLC.

	transactionDate, err := time.Parse(
		"2006-01-02",
		req.TransactionDate,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "transaction_date must be in YYYY-MM-DD format",
		})
		return
	}

	// ------------------------------------------------------
	// STEP 3: Prepare SQLC Parameters
	// ------------------------------------------------------

	params := sqlc.CreateTransactionParams{
		CustomerID:      req.CustomerID,
		MerchantID:      req.MerchantID,
		Amount:          req.Amount,
		Commission:      req.Commission,
		TransactionDate: transactionDate,
	}

	// ------------------------------------------------------
	// STEP 4: Call Transaction Service
	// ------------------------------------------------------

	err = h.service.CreateTransaction(
		c.Request.Context(),
		params,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// ------------------------------------------------------
	// STEP 5: Return Success Response
	// ------------------------------------------------------

	c.JSON(http.StatusCreated, gin.H{
		"message": "Transaction created successfully",
	})
}