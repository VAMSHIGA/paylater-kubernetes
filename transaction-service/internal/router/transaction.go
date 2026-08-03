// Package router registers Transaction HTTP routes.
//
// POST /transactions requires JWT and RoleAdmin or RoleCustomer.
package router

import (
	"github.com/gin-gonic/gin"

	"paylater/shared/constants"
	"paylater/shared/middleware"
	"paylater/transaction-service/internal/handler"
)

// TransactionRoutes registers POST /transactions with admin/customer authorization.
func TransactionRoutes(
	router *gin.Engine,
	handler *handler.TransactionHandler,
) {

	router.POST(
		"/transactions",
		middleware.AuthMiddleware(),
		middleware.AuthorizeRoles(
			constants.RoleAdmin,
			constants.RoleCustomer,
		),
		handler.CreateTransaction,
	)
}
