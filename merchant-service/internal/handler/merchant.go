// Package handler contains HTTP handlers for Merchant Service APIs.
//
// CreateMerchant accepts admin or merchant JWTs; UpdateMerchantCommission is
// admin-only (enforced in the router). Onboarding dates must be YYYY-MM-DD.
package handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"paylater/merchant-service/db/sqlc"
	"paylater/merchant-service/internal/service"
	"paylater/shared/constants"
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

	if roleValue, exists := c.Get(constants.ContextKeyRole); exists {
		if role, ok := roleValue.(string); ok && role == constants.RoleMerchant {
			if userIDValue, userExists := c.Get(constants.ContextKeyUserID); userExists {
				if userID, ok := userIDValue.(int64); ok {
					params.UserID = sql.NullInt64{Int64: userID, Valid: true}
				}
			}
		}
	}

	err = h.service.CreateMerchant(
		c.Request.Context(),
		params,
	)

	if err != nil {
		response.InternalError(c, err)
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
		if errors.Is(err, service.ErrMerchantNotFound) {
			response.Error(c, http.StatusNotFound, "merchant not found")
			return
		}
		response.InternalError(c, err)
		return
	}

	response.SuccessMessage(c, http.StatusOK, "Merchant commission updated successfully")
}

type MerchantProfileResponse struct {
	ID           int64  `json:"ID"`
	MerchantName string `json:"MerchantName"`
	PhoneNumber  string `json:"PhoneNumber"`
	Onboarding   string `json:"Onboarding"`
	Commission   string `json:"Commission"`
}

type MerchantDashboardTransactionResponse struct {
	ID                int64  `json:"ID"`
	CustomerID        int64  `json:"CustomerID"`
	CustomerName      string `json:"CustomerName"`
	Amount            string `json:"Amount"`
	CommissionPercent string `json:"CommissionPercent"`
	CommissionAmount  string `json:"CommissionAmount"`
	MerchantNetAmount string `json:"MerchantNetAmount"`
	TransactionDate   string `json:"TransactionDate"`
}

type MerchantDashboardResponse struct {
	ID                 int64                                  `json:"ID"`
	MerchantName       string                                 `json:"MerchantName"`
	CommissionPercent  string                                 `json:"CommissionPercent"`
	TotalTransactions  int64                                  `json:"TotalTransactions"`
	TotalSales         string                                 `json:"TotalSales"`
	TotalCommission    string                                 `json:"TotalCommission"`
	MerchantEarnings   string                                 `json:"MerchantEarnings"`
	PayLaterCommission string                               `json:"PayLaterCommission"`
	RecentTransactions []MerchantDashboardTransactionResponse `json:"RecentTransactions"`
}

func (h *MerchantHandler) GetMyMerchant(c *gin.Context) {
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

	merchant, err := h.service.GetMyMerchantProfile(c.Request.Context(), userID, email)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.JSON(c, http.StatusOK, MerchantProfileResponse{
		ID:           merchant.ID,
		MerchantName: merchant.MerchantName,
		PhoneNumber:  merchant.PhoneNumber,
		Onboarding:   merchant.Onboarding.Format("2006-01-02"),
		Commission:   merchant.Commission,
	})
}

func (h *MerchantHandler) GetMyMerchantDashboard(c *gin.Context) {
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

	dashboard, err := h.service.GetMerchantDashboard(c.Request.Context(), userID, email)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	recent := make([]MerchantDashboardTransactionResponse, 0, len(dashboard.RecentTransactions))
	for _, transaction := range dashboard.RecentTransactions {
		customerLabel := transaction.CustomerName
		if customerLabel == "" {
			customerLabel = strconv.FormatInt(transaction.CustomerID, 10)
		}

		recent = append(recent, MerchantDashboardTransactionResponse{
			ID:                transaction.ID,
			CustomerID:        transaction.CustomerID,
			CustomerName:      customerLabel,
			Amount:            transaction.Amount,
			CommissionPercent: dashboard.Merchant.Commission,
			CommissionAmount:  transaction.CommissionAmount,
			MerchantNetAmount: transaction.MerchantNetAmount,
			TransactionDate:   transaction.TransactionDate,
		})
	}

	response.JSON(c, http.StatusOK, MerchantDashboardResponse{
		ID:                 dashboard.Merchant.ID,
		MerchantName:       dashboard.Merchant.MerchantName,
		CommissionPercent:  dashboard.Merchant.Commission,
		TotalTransactions:  dashboard.TotalTransactions,
		TotalSales:         dashboard.TotalSales,
		TotalCommission:    dashboard.TotalCommission,
		MerchantEarnings:   dashboard.MerchantEarnings,
		PayLaterCommission: dashboard.PayLaterCommission,
		RecentTransactions: recent,
	})
}
