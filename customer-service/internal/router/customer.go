// Package router registers Customer HTTP routes with JWT and admin authorization.
//
// Both POST and GET /customers require a valid Bearer token and RoleAdmin.
package router

import (
	"github.com/gin-gonic/gin"

	"paylater/customer-service/internal/handler"
	"paylater/shared/constants"
	"paylater/shared/middleware"
)

// CustomerRoutes registers POST /customers and GET /customers (admin only).
func CustomerRoutes(
	router *gin.Engine,
	handler *handler.CustomerHandler,
) {

	router.POST(
		"/customers",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.CreateCustomer,
	)

	router.GET(
		"/customers",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleAdmin),
		handler.ListCustomers,
	)
}
