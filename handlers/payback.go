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

// CreatePaybackRequest represents the JSON request body
// received when a customer makes a repayment.
type CreatePaybackRequest struct {
	CustomerID  int64  `json:"customer_id" binding:"required"`
	Amount      string `json:"amount" binding:"required"`
	PaymentDate string `json:"payment_date" binding:"required"`
}

// ==========================================================
// Payback Handler
// ==========================================================

// PaybackHandler handles all payback-related HTTP requests.
type PaybackHandler struct {
	service *services.PaybackService
}

// NewPaybackHandler creates a new PaybackHandler.
//
// PaybackService is passed to the handler so the handler
// can call the business logic.
func NewPaybackHandler(
	service *services.PaybackService,
) *PaybackHandler {

	return &PaybackHandler{
		service: service,
	}
}

// ==========================================================
// POST /paybacks
// ==========================================================

// CreatePayback creates a new customer repayment.
//
// Example request:
//
// {
//     "customer_id": 1,
//     "amount": "200.00",
//     "payment_date": "2026-07-29"
// }
func (h *PaybackHandler) CreatePayback(c *gin.Context) {

	// ------------------------------------------------------
	// STEP 1: Read JSON Request
	// ------------------------------------------------------

	var req CreatePaybackRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// ------------------------------------------------------
	// STEP 2: Convert Payment Date
	// ------------------------------------------------------
	// The API receives payment_date as a string:
	//
	// "2026-07-29"
	//
	// SQLC expects time.Time because payment_date
	// is a DATE column in MySQL.

	paymentDate, err := time.Parse(
		"2006-01-02",
		req.PaymentDate,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "payment_date must be in YYYY-MM-DD format",
		})
		return
	}

	// ------------------------------------------------------
	// STEP 3: Prepare SQLC Parameters
	// ------------------------------------------------------

	params := sqlc.CreatePaybackParams{
		CustomerID:  req.CustomerID,
		Amount:      req.Amount,
		PaymentDate: paymentDate,
	}

	// ------------------------------------------------------
	// STEP 4: Call Payback Service
	// ------------------------------------------------------

	err = h.service.CreatePayback(
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
		"message": "Payback created successfully",
	})
}