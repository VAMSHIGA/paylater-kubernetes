package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"paylater/db/sqlc"
	"paylater/services"
)

// Request body for POST /customers
type CreateCustomerRequest struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	CreditLimit string `json:"credit_limit"`
	Repay       string `json:"repay"`
}

// Request body for PUT /customers/:id
type UpdateCustomerRequest struct {
	Name        string `json:"name"`
	Email       string `json:"email"`
	CreditLimit string `json:"credit_limit"`
	Repay       string `json:"repay"`
}

type CustomerHandler struct {
	service *services.CustomerService
}

func NewCustomerHandler(service *services.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		service: service,
	}
}

// POST /customers
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	var req CreateCustomerRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	params := sqlc.CreateCustomerParams{
		Name:        req.Name,
		Email:       req.Email,
		CreditLimit: req.CreditLimit,
		Repay: sql.NullString{
			String: req.Repay,
			Valid:  req.Repay != "",
		},
	}

	err := h.service.CreateCustomer(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Customer created successfully",
	})
}

// GET /customers/:id
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	customer, err := h.service.GetCustomer(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, customer)
}

// GET /customers
func (h *CustomerHandler) ListCustomers(c *gin.Context) {
	customers, err := h.service.ListCustomers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, customers)
}

// PUT /customers/:id
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	var req UpdateCustomerRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	params := sqlc.UpdateCustomerParams{
		Name:        req.Name,
		Email:       req.Email,
		CreditLimit: req.CreditLimit,
		Repay: sql.NullString{
			String: req.Repay,
			Valid:  req.Repay != "",
		},
		ID: id,
	}

	err = h.service.UpdateCustomer(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer updated successfully",
	})
}

// DELETE /customers/:id
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid customer ID",
		})
		return
	}

	err = h.service.DeleteCustomer(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Customer deleted successfully",
	})
}