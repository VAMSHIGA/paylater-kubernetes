// Package handler contains all HTTP request handlers.
// It receives client requests, validates input, calls the service layer,
// and sends responses back to the client.
package handler

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	// SQLC generated types
	"paylater/customer-service/db/sqlc"

	// Business logic
	"paylater/customer-service/internal/service"

	// Common response helper
	"paylater/shared/constants"
	"paylater/shared/response"
)

// CreateCustomerRequest represents the JSON request
// received from the client.
type CreateCustomerRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	CreditLimit string `json:"credit_limit" binding:"required"`
	UserID      *int64 `json:"user_id"`
}

// CustomerProfileResponse is returned by GET /customers/me.
type CustomerProfileResponse struct {
	ID              int64  `json:"ID"`
	Name            string `json:"Name"`
	Email           string `json:"Email"`
	CreditLimit     string `json:"CreditLimit"`
	OutstandingDue  string `json:"OutstandingDue"`
	AvailableCredit string `json:"AvailableCredit"`
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

	if req.UserID != nil {
		params.UserID = sql.NullInt64{
			Int64: *req.UserID,
			Valid: true,
		}
	}

	// Call service layer to create customer
	err := h.service.CreateCustomer(c.Request.Context(), params)
	if err != nil {
		if errors.Is(err, service.ErrIdentityCustomerNotFound) {
			response.Error(c, http.StatusNotFound, err.Error())
			return
		}

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

// GetMyCustomer handles GET /customers/me for the authenticated customer profile.
func (h *CustomerHandler) GetMyCustomer(c *gin.Context) {
	userIDValue, exists := c.Get(constants.ContextKeyUserID)
	if !exists {
		response.Error(c, http.StatusUnauthorized, "user not authenticated")
		return
	}

	userID, ok := userIDValue.(int64)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "invalid user context")
		return
	}

	emailValue, _ := c.Get(constants.ContextKeyEmail)
	email, _ := emailValue.(string)

	profile, err := h.service.GetMyCustomerProfile(c.Request.Context(), userID, email)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.JSON(c, http.StatusOK, CustomerProfileResponse{
		ID:              profile.Customer.ID,
		Name:            profile.Customer.Name,
		Email:           profile.Customer.Email,
		CreditLimit:     profile.Customer.CreditLimit,
		OutstandingDue:  profile.OutstandingDue,
		AvailableCredit: profile.AvailableCredit,
	})
}
