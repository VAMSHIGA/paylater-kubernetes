// Package router registers Identity HTTP routes on a Gin engine.
//
// Auth endpoints are public (no JWT middleware): clients register and login
// here, then use the returned token against other services via the gateway.
package router

import (
	"github.com/gin-gonic/gin"

	"paylater/identity-service/internal/handler"
)

// AuthRoutes registers POST /auth/register and POST /auth/login.
//
// These routes intentionally have no AuthMiddleware; authentication is the
// purpose of this service.
func AuthRoutes(router *gin.Engine, handler *handler.AuthHandler) {
	auth := router.Group("/auth")

	auth.POST("/register", handler.Register)
	auth.POST("/login", handler.Login)
}
