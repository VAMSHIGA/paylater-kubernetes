// Package handler contains HTTP handlers for Transaction Service APIs.
//
// POST /transactions records a PayLater purchase. Access is limited to admin
// or customer roles. transaction_date must be YYYY-MM-DD.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/shared/response"
	"paylater/shared/validator"
	"paylater/transaction-service/db/sqlc"
	"paylater/transaction-service/internal/service"
)

// CreateTransactionRequest represents the JSON body
// received when a customer makes a PayLater purchase.
type CreateTransactionRequest struct {
	CustomerID      int64  `json:"customer_id" binding:"required"`
	MerchantID      int64  `json:"merchant_id" binding:"required"`
	Amount          string `json:"amount" binding:"required"`
	Commission      string `json:"commission" binding:"required"`
	TransactionDate string `json:"transaction_date" binding:"required"`
}

// TransactionHandler handles transaction-related HTTP requests.
type TransactionHandler struct {
	service *service.TransactionService
}

// NewTransactionHandler creates a new TransactionHandler.
func NewTransactionHandler(
	service *service.TransactionService,
) *TransactionHandler {

	return &TransactionHandler{
		service: service,
	}
}

// CreateTransaction handles POST /transactions and persists a purchase in transaction_db.
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {

	var req CreateTransactionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	transactionDate, err := validator.ParseDateYYYYMMDD(req.TransactionDate)

	if err != nil {
		response.ValidationError(c, "transaction_date must be in YYYY-MM-DD format")
		return
	}

	params := sqlc.CreateTransactionParams{
		CustomerID:      req.CustomerID,
		MerchantID:      req.MerchantID,
		Amount:          req.Amount,
		Commission:      req.Commission,
		TransactionDate: transactionDate,
	}

	err = h.service.CreateTransaction(
		c.Request.Context(),
		params,
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "Transaction created successfully")
}
