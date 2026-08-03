// Package router registers Reporting HTTP routes (all admin-only).
//
// Endpoints: merchant-fees, customer-dues, credit-limit, total-dues.
package router

import (
	"github.com/gin-gonic/gin"

	"paylater/reporting-service/internal/handler"
	"paylater/shared/constants"
	"paylater/shared/middleware"
)

// ReportRoutes registers the four GET /reports/* endpoints with admin authorization.
func ReportRoutes(
	router *gin.Engine,
	handler *handler.ReportHandler,
) {

	router.GET(
		"/reports/merchant-fees",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.GetMerchantFee,
	)

	router.GET(
		"/reports/customer-dues",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.GetCustomerDues,
	)

	router.GET(
		"/reports/credit-limit",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.GetUsersAtCreditLimit,
	)

	router.GET(
		"/reports/total-dues",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.GetTotalDues,
	)
}
