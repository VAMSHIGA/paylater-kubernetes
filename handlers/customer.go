package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/db/sqlc"
	"paylater/services"
)

////////////////////////////////////////////////////////////////////////////////
// Request Structures
////////////////////////////////////////////////////////////////////////////////

// CreateCustomerRequest represents the JSON request body
// received from the client while creating a customer.
type CreateCustomerRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	CreditLimit string `json:"credit_limit" binding:"required"`
}

////////////////////////////////////////////////////////////////////////////////
// Handler
////////////////////////////////////////////////////////////////////////////////

// CustomerHandler handles all customer-related HTTP requests.
type CustomerHandler struct {
	service *services.CustomerService
}

// NewCustomerHandler creates a new CustomerHandler.
func NewCustomerHandler(service *services.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		service: service,
	}
}

////////////////////////////////////////////////////////////////////////////////
// POST /customers
////////////////////////////////////////////////////////////////////////////////

// CreateCustomer creates a new customer.
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {

	// Variable to hold request body.
	var req CreateCustomerRequest

	// Read JSON request.
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert request into SQLC parameters.
	params := sqlc.CreateCustomerParams{
		Name:        req.Name,
		Email:       req.Email,
		CreditLimit: req.CreditLimit,
	}

	// Call service layer.
	err := h.service.CreateCustomer(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Success response.
	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer created successfully",
	})
}

////////////////////////////////////////////////////////////////////////////////
// GET /customers
////////////////////////////////////////////////////////////////////////////////

// ListCustomers returns all customers.
func (h *CustomerHandler) ListCustomers(c *gin.Context) {

	// Fetch customers from service.
	customers, err := h.service.ListCustomers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Return customers.
	c.JSON(http.StatusOK, customers)
}