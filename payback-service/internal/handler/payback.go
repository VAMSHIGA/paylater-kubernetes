// Package handler contains HTTP handlers for Payback Service APIs.
//
// POST /paybacks records a customer repayment. Access is admin or customer.
// payment_date must be YYYY-MM-DD. Customer-role callers cannot repay more
// than their outstanding due.
package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/payback-service/db/sqlc"
	"paylater/payback-service/internal/service"
	"paylater/shared/constants"
	"paylater/shared/customerauth"
	platformerrors "paylater/shared/errors"
	"paylater/shared/response"
	"paylater/shared/validator"
)

// CreatePaybackRequest represents the JSON request body
// received when a customer makes a repayment.
type CreatePaybackRequest struct {
	CustomerID  int64  `json:"customer_id" binding:"required"`
	Amount      string `json:"amount" binding:"required"`
	PaymentDate string `json:"payment_date" binding:"required"`
}

// PaybackHandler handles all payback-related HTTP requests.
type PaybackHandler struct {
	service           *service.PaybackService
	ownershipResolver customerauth.Resolver
}

// NewPaybackHandler creates a new PaybackHandler.
func NewPaybackHandler(
	paybackService *service.PaybackService,
	ownershipResolver customerauth.Resolver,
) *PaybackHandler {

	return &PaybackHandler{
		service:           paybackService,
		ownershipResolver: ownershipResolver,
	}
}

// CreatePayback handles POST /paybacks and inserts a repayment into payback_db.
func (h *PaybackHandler) CreatePayback(c *gin.Context) {

	var req CreatePaybackRequest

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

	paymentDate, err := validator.ParseDateYYYYMMDD(req.PaymentDate)

	if err != nil {
		response.ValidationError(c, "payment_date must be in YYYY-MM-DD format")
		return
	}

	params := sqlc.CreatePaybackParams{
		CustomerID:  req.CustomerID,
		Amount:      req.Amount,
		PaymentDate: paymentDate,
	}

	err = h.service.CreatePayback(
		c.Request.Context(),
		params,
		callerRole(c),
	)

	if err != nil {
		if errors.Is(err, service.ErrCustomerNotFound) {
			response.Error(c, http.StatusNotFound, "customer not found")
			return
		}
		if errors.Is(err, platformerrors.ErrPaybackExceedsRemainingDue) {
			response.Error(c, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, platformerrors.ErrInvalidPaybackAmount) {
			response.Error(c, http.StatusBadRequest, err.Error())
			return
		}
		response.InternalError(c, err)
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "Payback created successfully")
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
