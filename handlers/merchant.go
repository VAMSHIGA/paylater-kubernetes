package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/db/sqlc"
	"paylater/services"
)

// Request body for POST /merchants
type CreateMerchantRequest struct {
	MerchantName string `json:"merchant_name"`
	PhoneNumber  string `json:"phone_number"`
	Onboarding   string `json:"onboarding"`
	Commission   string `json:"commission"`
}

// Request body for PUT /merchants/:id
type UpdateMerchantRequest struct {
	MerchantName string `json:"merchant_name"`
	PhoneNumber  string `json:"phone_number"`
	Onboarding   string `json:"onboarding"`
	Commission   string `json:"commission"`
}

type MerchantHandler struct {
	service *services.MerchantService
}

func NewMerchantHandler(service *services.MerchantService) *MerchantHandler {
	return &MerchantHandler{
		service: service,
	}
}

// POST /merchants
func (h *MerchantHandler) CreateMerchant(c *gin.Context) {
	var req CreateMerchantRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert "2026-07-28" string to time.Time
	onboardingDate, err := time.Parse("2006-01-02", req.Onboarding)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "onboarding must be YYYY-MM-DD",
		})
		return
	}

	params := sqlc.CreateMerchantParams{
		MerchantName: req.MerchantName,
		PhoneNumber:  req.PhoneNumber,
		Onboarding:   onboardingDate,
		Commission:   req.Commission,
	}

	err = h.service.CreateMerchant(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Merchant created successfully",
	})
}

// GET /merchants
func (h *MerchantHandler) ListMerchants(c *gin.Context) {
	merchants, err := h.service.ListMerchants(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, merchants)
}

// GET /merchants/:id
func (h *MerchantHandler) GetMerchant(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid merchant ID",
		})
		return
	}

	merchant, err := h.service.GetMerchant(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, merchant)
}

// PUT /merchants/:id
func (h *MerchantHandler) UpdateMerchant(c *gin.Context) {
	var req UpdateMerchantRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid merchant ID",
		})
		return
	}

	onboardingDate, err := time.Parse("2006-01-02", req.Onboarding)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "onboarding must be YYYY-MM-DD",
		})
		return
	}

	params := sqlc.UpdateMerchantParams{
		MerchantName: req.MerchantName,
		PhoneNumber:  req.PhoneNumber,
		Onboarding:   onboardingDate,
		Commission:   req.Commission,
		ID:           id,
	}

	err = h.service.UpdateMerchant(c.Request.Context(), params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Merchant updated successfully",
	})
}

// DELETE /merchants/:id
func (h *MerchantHandler) DeleteMerchant(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid merchant ID",
		})
		return
	}

	err = h.service.DeleteMerchant(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Merchant deleted successfully",
	})
}