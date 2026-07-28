package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/services"
)

// ========================================
// Report Handler
// ========================================
// ReportHandler handles all report API requests.
type ReportHandler struct {
	service *services.ReportService
}

// ========================================
// Create Report Handler
// ========================================
func NewReportHandler(
	service *services.ReportService,
) *ReportHandler {

	return &ReportHandler{
		service: service,
	}
}

// ========================================
// Helper Function
// ========================================
// MySQL may return DECIMAL/CHAR values as []byte.
//
// When []byte is directly converted to JSON,
// Go displays it as Base64.
//
// Example:
// NTAwMC4wMA==
//
// This function converts []byte into:
// 5000.00
func valueToString(value interface{}) string {

	// If database value is NULL
	if value == nil {
		return "0.00"
	}

	// Convert []byte to normal string
	if bytes, ok := value.([]byte); ok {
		return string(bytes)
	}

	// Convert other values to string
	return fmt.Sprint(value)
}

// ========================================
// 1. GET /reports/merchant-fees
// ========================================
// Returns merchant names and commissions.
func (h *ReportHandler) GetMerchantFee(c *gin.Context) {

	merchantFees, err := h.service.GetMerchantFee(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, merchantFees)
}

// ========================================
// 2. GET /reports/customer-dues
// ========================================
// Returns:
//
// Customer ID
// Customer Name
// Total Transaction
// Total Repaid
// Remaining Due
//
// Remaining Due = Total Transaction - Total Repaid
func (h *ReportHandler) GetCustomerDues(c *gin.Context) {

	customerDues, err := h.service.GetCustomerDues(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create clean response
	// instead of directly returning SQLC values.
	response := make([]gin.H, 0, len(customerDues))

	for _, customer := range customerDues {

		response = append(response, gin.H{

			// Customer information
			"customer_id": customer.CustomerID,
			"name":        customer.Name,

			// Convert MySQL []byte values
			// into normal readable strings.
			"total_transaction": valueToString(
				customer.TotalTransaction,
			),

			"total_repaid": valueToString(
				customer.TotalRepaid,
			),

			"remaining_due": valueToString(
				customer.RemainingDue,
			),
		})
	}

	c.JSON(http.StatusOK, response)
}

// ========================================
// 3. GET /reports/credit-limit
// ========================================
// Returns customers whose remaining due
// reached or exceeded their credit limit.
func (h *ReportHandler) GetUsersAtCreditLimit(c *gin.Context) {

	customers, err := h.service.GetUsersAtCreditLimit(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Create clean response.
	// RemainingDue may also come from MySQL as []byte.
	response := make([]gin.H, 0, len(customers))

	for _, customer := range customers {

		response = append(response, gin.H{
			"customer_id":   customer.CustomerID,
			"name":          customer.Name,
			"credit_limit":  customer.CreditLimit,
			"remaining_due": valueToString(customer.RemainingDue),
		})
	}

	c.JSON(http.StatusOK, response)
}

// ========================================
// 4. GET /reports/total-dues
// ========================================
// Returns the total remaining amount
// that all customers need to repay.
func (h *ReportHandler) GetTotalDues(c *gin.Context) {

	totalDues, err := h.service.GetTotalDues(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Convert MySQL []byte value to readable string.
	c.JSON(http.StatusOK, gin.H{
		"total_dues": valueToString(totalDues),
	})
}
