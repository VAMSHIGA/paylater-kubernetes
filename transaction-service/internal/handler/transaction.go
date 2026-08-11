// Package handler contains HTTP handlers for Transaction Service APIs.
//
// POST /transactions records a PayLater purchase. Access is limited to admin
// or customer roles. transaction_date must be YYYY-MM-DD.
package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/shared/constants"
	"paylater/shared/customerauth"
	platformerrors "paylater/shared/errors"
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
	service           *service.TransactionService
	ownershipResolver customerauth.Resolver
}

// NewTransactionHandler creates a new TransactionHandler.
func NewTransactionHandler(
	transactionService *service.TransactionService,
	ownershipResolver customerauth.Resolver,
) *TransactionHandler {

	return &TransactionHandler{
		service:           transactionService,
		ownershipResolver: ownershipResolver,
	}
}

// CreateTransaction handles POST /transactions and persists a purchase in transaction_db.
func (h *TransactionHandler) CreateTransaction(c *gin.Context) {

	var req CreateTransactionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	if customerauth.WriteOwnershipError(
		c,
		customerauth.EnforceCustomerAccessFromContext(c, req.CustomerID, h.ownershipResolver),
	) {
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
		callerRole(c),
	)

	if err != nil {
		if errors.Is(err, service.ErrCustomerNotFound) {
			response.Error(c, http.StatusNotFound, "customer not found")
			return
		}
		if errors.Is(err, service.ErrMerchantNotFound) {
			response.Error(c, http.StatusNotFound, "merchant not found")
			return
		}
		if errors.Is(err, platformerrors.ErrCreditLimitExceeded) {
			response.Error(c, http.StatusBadRequest, err.Error())
			return
		}
		response.InternalError(c, err)
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "Transaction created successfully")
}

func callerRole(c *gin.Context) string {
	roleValue, exists := c.Get(constants.ContextKeyRole)
	if !exists {
		return ""
	}

	role, ok := roleValue.(string)
	if !ok {
		return ""
	}

	return role
}
