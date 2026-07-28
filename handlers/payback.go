package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/db/sqlc"
	"paylater/services"
)

// Request body for POST /paybacks
type CreatePaybackRequest struct {
	CustomerID  int64  `json:"customer_id"`
	Amount      string `json:"amount"`
	PaymentDate string `json:"payment_date"`
}

type PaybackHandler struct {
	service *services.PaybackService
}

// Create Payback Handler
func NewPaybackHandler(
	service *services.PaybackService,
) *PaybackHandler {
	return &PaybackHandler{
		service: service,
	}
}

// POST /paybacks
func (h *PaybackHandler) CreatePayback(c *gin.Context) {
	var req CreatePaybackRequest

	// Read JSON body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert payment date string to time.Time
	paymentDate, err := time.Parse("2006-01-02", req.PaymentDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "payment_date must be YYYY-MM-DD",
		})
		return
	}

	// Convert request into SQLC parameters
	params := sqlc.CreatePaybackParams{
		CustomerID:  req.CustomerID,
		Amount:      req.Amount,
		PaymentDate: paymentDate,
	}

	// Call Payback Service
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

	c.JSON(http.StatusCreated, gin.H{
		"message": "Payback created successfully",
	})
}

// GET /paybacks
func (h *PaybackHandler) ListPaybacks(c *gin.Context) {
	paybacks, err := h.service.ListPaybacks(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, paybacks)
}

// GET /paybacks/:id
func (h *PaybackHandler) GetPayback(c *gin.Context) {
	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid payback ID",
		})
		return
	}

	payback, err := h.service.GetPayback(
		c.Request.Context(),
		id,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, payback)
}

// DELETE /paybacks/:id
func (h *PaybackHandler) DeletePayback(c *gin.Context) {
	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid payback ID",
		})
		return
	}

	err = h.service.DeletePayback(
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
		"message": "Payback deleted successfully",
	})
}