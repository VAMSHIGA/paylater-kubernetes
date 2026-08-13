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

// CustomerRoutes registers customer HTTP routes.
func CustomerRoutes(
	router *gin.Engine,
	handler *handler.CustomerHandler,
) {

	router.GET(
		"/customers/me",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(constants.RoleCustomer),
		handler.GetMyCustomer,
	)

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
