// Package handler contains HTTP handlers for Merchant Service APIs.
//
// CreateMerchant accepts admin or merchant JWTs; UpdateMerchantCommission is
// admin-only (enforced in the router). Onboarding dates must be YYYY-MM-DD.
package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"paylater/merchant-service/db/sqlc"
	"paylater/merchant-service/internal/service"
	"paylater/shared/response"
	"paylater/shared/validator"
)

// CreateMerchantRequest represents the JSON body
// received when creating/onboarding a new merchant.
type CreateMerchantRequest struct {
	MerchantName string `json:"merchant_name" binding:"required"`
	PhoneNumber  string `json:"phone_number" binding:"required"`
	Onboarding   string `json:"onboarding" binding:"required"`
	Commission   string `json:"commission" binding:"required"`
}

// UpdateMerchantCommissionRequest represents the JSON body
// received when updating a merchant's commission.
type UpdateMerchantCommissionRequest struct {
	Commission string `json:"commission" binding:"required"`
}

// MerchantHandler handles merchant-related HTTP requests.
type MerchantHandler struct {
	service *service.MerchantService
}

// NewMerchantHandler creates a new MerchantHandler.
func NewMerchantHandler(
	service *service.MerchantService,
) *MerchantHandler {

	return &MerchantHandler{
		service: service,
	}
}

// CreateMerchant handles POST /merchants and onboards a merchant into merchant_db.
func (h *MerchantHandler) CreateMerchant(c *gin.Context) {

	var req CreateMerchantRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	onboardingDate, err := validator.ParseDateYYYYMMDD(req.Onboarding)

	if err != nil {
		response.ValidationError(c, "onboarding must be in YYYY-MM-DD format")
		return
	}

	params := sqlc.CreateMerchantParams{
		MerchantName: req.MerchantName,
		PhoneNumber:  req.PhoneNumber,
		Onboarding:   onboardingDate,
		Commission:   req.Commission,
	}

	err = h.service.CreateMerchant(
		c.Request.Context(),
		params,
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "Merchant created successfully")
}

// UpdateMerchantCommission handles PUT /merchants/:id (admin only).
//
// Updates only the commission field; other merchant attributes are unchanged.
func (h *MerchantHandler) UpdateMerchantCommission(c *gin.Context) {

	id, err := strconv.ParseInt(
		c.Param("id"),
		10,
		64,
	)

	if err != nil {
		response.ValidationError(c, "Invalid merchant ID")
		return
	}

	var req UpdateMerchantCommissionRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	params := sqlc.UpdateMerchantCommissionParams{
		Commission: req.Commission,
		ID:         id,
	}

	err = h.service.UpdateMerchantCommission(
		c.Request.Context(),
		params,
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.SuccessMessage(c, http.StatusOK, "Merchant commission updated successfully")
}
