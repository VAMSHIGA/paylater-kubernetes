// Package router registers Merchant HTTP routes with JWT and role checks.
//
// POST /merchants allows admin or merchant. PUT /merchants/:id is admin only.
package router

import (
	"github.com/gin-gonic/gin"

	"paylater/merchant-service/internal/handler"
	"paylater/shared/constants"
	"paylater/shared/middleware"
)

// RegisterMerchantRoutes registers merchant create and commission-update APIs.
func RegisterMerchantRoutes(
	router *gin.Engine,
	handler *handler.MerchantHandler,
) {

	router.POST(
		"/merchants",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin, constants.RoleMerchant),
		handler.CreateMerchant,
	)

	router.PUT(
		"/merchants/:id",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.UpdateMerchantCommission,
	)
}
