// Package handler contains HTTP handlers for Customer Service APIs.
//
// Handlers validate JSON input, map requests to SQLC params, call CustomerService,
// and return HTTP responses. Admin-only access is enforced by router middleware.
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/customer-service/db/sqlc"
	"paylater/customer-service/internal/service"
	"paylater/shared/response"
)

// CreateCustomerRequest represents the JSON request body
// received from the client while creating a customer.
type CreateCustomerRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	CreditLimit string `json:"credit_limit" binding:"required"`
}

// CustomerHandler handles all customer-related HTTP requests.
type CustomerHandler struct {
	service *service.CustomerService
}

// NewCustomerHandler creates a new CustomerHandler.
func NewCustomerHandler(service *service.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		service: service,
	}
}

// CreateCustomer handles POST /customers and inserts a customer into customer_db.
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {

	var req CreateCustomerRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	params := sqlc.CreateCustomerParams{
		Name:        req.Name,
		Email:       req.Email,
		CreditLimit: req.CreditLimit,
	}

	err := h.service.CreateCustomer(c.Request.Context(), params)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "Customer created successfully")
}

// ListCustomers handles GET /customers and returns the full customer list as JSON.
func (h *CustomerHandler) ListCustomers(c *gin.Context) {

	customers, err := h.service.ListCustomers(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(c, http.StatusOK, customers)
}
