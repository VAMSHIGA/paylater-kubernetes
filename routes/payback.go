package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
)

// PaybackRoutes registers all Payback endpoints
func PaybackRoutes(
	router *gin.Engine,
	handler *handlers.PaybackHandler,
) {

	// Create Payback
	router.POST("/paybacks", handler.CreatePayback)

	// Get All Paybacks
	router.GET("/paybacks", handler.ListPaybacks)

	// Get Payback by ID
	router.GET("/paybacks/:id", handler.GetPayback)

	// Delete Payback by ID
	router.DELETE("/paybacks/:id", handler.DeletePayback)
}