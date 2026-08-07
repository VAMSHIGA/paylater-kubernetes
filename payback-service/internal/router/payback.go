// Package router registers Payback HTTP routes.
//
// POST /paybacks requires JWT and RoleAdmin or RoleCustomer.
package router

import (
	"github.com/gin-gonic/gin"

	"paylater/payback-service/internal/handler"
	"paylater/shared/constants"
	"paylater/shared/middleware"
)

// PaybackRoutes registers POST /paybacks with admin/customer authorization.
func PaybackRoutes(
	router *gin.Engine,
	handler *handler.PaybackHandler,
) {

	router.POST(
		"/paybacks",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(
			constants.RoleAdmin,
			constants.RoleCustomer,
		),
		handler.CreatePayback,
	)
}
