// Package handler contains all HTTP request handlers.
// It receives client requests, validates input, calls the service layer,
// and sends responses back to the client.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	// SQLC generated types
	"paylater/customer-service/db/sqlc"

	// Business logic
	"paylater/customer-service/internal/service"

	// Common response helper
	"paylater/shared/response"
)

// CreateCustomerRequest represents the JSON request
// received from the client.
type CreateCustomerRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	CreditLimit string `json:"credit_limit" binding:"required"`
}

// CustomerHandler handles all customer-related API requests.  blueprint for the customer services
type CustomerHandler struct {
	// Service layer
	service *service.CustomerService
}

// NewCustomerHandler creates a new CustomerHandler   actually implementation  of the customer services
// and stores the Customer Service inside it.
func NewCustomerHandler(service *service.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		service: service,
	}
}

// CreateCustomer handles POST /customers API.
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {

	// Variable to store client request data
	var req CreateCustomerRequest

	// Read JSON from request body and validate it
	if err := c.ShouldBindJSON(&req); err != nil {

		// Return validation error if request is invalid
		response.ValidationError(c, err.Error())
		return
	}

	// Convert request into SQLC parameters
	params := sqlc.CreateCustomerParams{
		Name:        req.Name,
		Email:       req.Email,
		CreditLimit: req.CreditLimit,
	}

	// Call service layer to create customer
	err := h.service.CreateCustomer(c.Request.Context(), params)
	if err != nil {

		// Return error if customer creation fails
		response.InternalError(c, err)
		return
	}

	// Return success response
	response.SuccessMessage(c, http.StatusCreated, "Customer created successfully")
}

// ListCustomers handles GET /customers API.
func (h *CustomerHandler) ListCustomers(c *gin.Context) {

	// Call service layer to get all customers
	customers, err := h.service.ListCustomers(c.Request.Context())
	if err != nil {

		// Return error if database operation fails
		response.InternalError(c, err)
		return
	}

	// Return customer list as JSON response
	response.JSON(c, http.StatusOK, customers)
}
