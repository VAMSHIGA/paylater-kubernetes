package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
)

// ReportRoutes registers all Report APIs
func ReportRoutes(
	router *gin.Engine,
	handler *handlers.ReportHandler,
) {

	// Get merchant fees
	router.GET("/reports/merchant-fees", handler.GetMerchantFee)

	// Get customer dues
	router.GET("/reports/customer-dues", handler.GetCustomerDues)

	// Get customers who reached credit limit
	router.GET("/reports/credit-limit", handler.GetUsersAtCreditLimit)

	// Get total dues
	router.GET("/reports/total-dues", handler.GetTotalDues)
}