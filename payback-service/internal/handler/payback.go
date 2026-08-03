// Package handler contains HTTP handlers for Payback Service APIs.
//
// POST /paybacks records a customer repayment. Access is admin or customer.
// payment_date must be YYYY-MM-DD. Outstanding-balance checks are intentionally
// not applied here (preserve legacy create-only behavior).
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/payback-service/db/sqlc"
	"paylater/payback-service/internal/service"
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
	service *service.PaybackService
}

// NewPaybackHandler creates a new PaybackHandler.
func NewPaybackHandler(
	service *service.PaybackService,
) *PaybackHandler {

	return &PaybackHandler{
		service: service,
	}
}

// CreatePayback handles POST /paybacks and inserts a repayment into payback_db.
func (h *PaybackHandler) CreatePayback(c *gin.Context) {

	var req CreatePaybackRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
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
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "Payback created successfully")
}
