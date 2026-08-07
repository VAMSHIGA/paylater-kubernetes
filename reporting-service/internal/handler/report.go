// Package handler contains HTTP handlers for Reporting Service APIs.
//
// All report endpoints are admin-only. Handlers convert SQLC aggregate scan
// values with shared/utils.ValueToString so DECIMAL results are not Base64-encoded
// in JSON. Data is read from report_db (snapshot read model).
package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/reporting-service/internal/service"
	"paylater/shared/response"
	"paylater/shared/utils"
)

// ReportHandler handles all report API requests.
type ReportHandler struct {
	service *service.ReportService
}

// NewReportHandler creates a new ReportHandler.
func NewReportHandler(
	service *service.ReportService,
) *ReportHandler {

	return &ReportHandler{
		service: service,
	}
}

// GetMerchantFee handles GET /reports/merchant-fees (merchant name + commission).
func (h *ReportHandler) GetMerchantFee(c *gin.Context) {

	merchantFees, err := h.service.GetMerchantFee(
		c.Request.Context(),
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(c, http.StatusOK, merchantFees)
}

// GetCustomerDues handles GET /reports/customer-dues.
//
// Shapes each row with customer_id, name, total_transaction, total_repaid,
// and remaining_due (transactions − paybacks).
func (h *ReportHandler) GetCustomerDues(c *gin.Context) {

	customerDues, err := h.service.GetCustomerDues(
		c.Request.Context(),
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	payload := make([]gin.H, 0, len(customerDues))

	for _, customer := range customerDues {

		payload = append(payload, gin.H{
			"customer_id": customer.CustomerID,
			"name":        customer.Name,
			"total_transaction": utils.ValueToString(
				customer.TotalTransaction,
			),
			"total_repaid": utils.ValueToString(
				customer.TotalRepaid,
			),
			"remaining_due": utils.ValueToString(
				customer.RemainingDue,
			),
		})
	}

	response.JSON(c, http.StatusOK, payload)
}

// GetUsersAtCreditLimit handles GET /reports/credit-limit.
//
// Returns customers whose remaining due is greater than or equal to credit_limit.
func (h *ReportHandler) GetUsersAtCreditLimit(c *gin.Context) {

	customers, err := h.service.GetUsersAtCreditLimit(
		c.Request.Context(),
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	payload := make([]gin.H, 0, len(customers))

	for _, customer := range customers {

		payload = append(payload, gin.H{
			"customer_id":   customer.CustomerID,
			"name":          customer.Name,
			"credit_limit":  customer.CreditLimit,
			"remaining_due": utils.ValueToString(customer.RemainingDue),
		})
	}

	response.JSON(c, http.StatusOK, payload)
}

// GetTotalDues handles GET /reports/total-dues (system-wide remaining balance).
func (h *ReportHandler) GetTotalDues(c *gin.Context) {

	totalDues, err := h.service.GetTotalDues(
		c.Request.Context(),
	)

	if err != nil {
		response.Error(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.JSON(c, http.StatusOK, gin.H{
		"total_dues": utils.ValueToString(totalDues),
	})
}
