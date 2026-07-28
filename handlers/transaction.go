package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/db/sqlc"
	"paylater/services"
)

// Request body for POST /transactions
type CreateTransactionRequest struct {
	CustomerID      int64  `json:"customer_id"`
	MerchantID      int64  `json:"merchant_id"`
	Amount          string `json:"amount"`
	Commission      string `json:"commission"`
	TransactionDate string `json:"transaction_date"`
}

// Request body for PUT /transactions/:id
type UpdateTransactionRequest struct {
	CustomerID      int64  `json:"customer_id"`
	MerchantID      int64  `json:"merchant_id"`
	Amount          string `json:"amount"`
	Commission      string `json:"commission"`
	TransactionDate string `json:"transaction_date"`
}

type TransactionHandler struct {
	service *services.TransactionService
}

// Create Transaction Handler
func NewTransactionHandler(
	service *services.TransactionService,
) *TransactionHandler {
	return &TransactionHandler{
		service: service,
	}
}

// POST /transactions
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {
	var req CreateTransactionRequest

	// Read JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert date string into time.Time
	transactionDate, err := time.Parse(
		"2006-01-02",
		req.TransactionDate,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "transaction_date must be YYYY-MM-DD",
		})
		return
	}

	// Convert request into SQLc parameters
	params := sqlc.CreateTransactionParams{
		CustomerID:      req.CustomerID,
		MerchantID:      req.MerchantID,
		Amount:          req.Amount,
		Commission:      req.Commission,
		TransactionDate: transactionDate,
	}

	// Call Service
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

	c.JSON(http.StatusCreated, gin.H{
		"message": "Transaction created successfully",
	})
}

// GET /transactions
func (h *TransactionHandler) ListTransactions(c *gin.Context) {
	transactions, err := h.service.ListTransactions(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, transactions)
}

// GET /transactions/:id
func (h *TransactionHandler) GetTransaction(c *gin.Context) {
	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid transaction ID",
		})
		return
	}

	transaction, err := h.service.GetTransaction(
		c.Request.Context(),
		id,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, transaction)
}

// PUT /transactions/:id
func (h *TransactionHandler) UpdateTransaction(c *gin.Context) {
	var req UpdateTransactionRequest

	// Read JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Read transaction ID
	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid transaction ID",
		})
		return
	}

	// Convert date string into time.Time
	transactionDate, err := time.Parse(
		"2006-01-02",
		req.TransactionDate,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "transaction_date must be YYYY-MM-DD",
		})
		return
	}

	// Convert request into SQLc parameters
	params := sqlc.UpdateTransactionParams{
		CustomerID:      req.CustomerID,
		MerchantID:      req.MerchantID,
		Amount:          req.Amount,
		Commission:      req.Commission,
		TransactionDate: transactionDate,
		ID:              id,
	}

	// Call Service
	err = h.service.UpdateTransaction(
		c.Request.Context(),
		params,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction updated successfully",
	})
}

// DELETE /transactions/:id
func (h *TransactionHandler) DeleteTransaction(c *gin.Context) {
	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid transaction ID",
		})
		return
	}

	err = h.service.DeleteTransaction(
		c.Request.Context(),
		id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Transaction deleted successfully",
	})
}