package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
)

func RegisterMerchantRoutes(
	router *gin.Engine,
	handler *handlers.MerchantHandler,
) {
	router.POST("/merchants", handler.CreateMerchant)
	router.GET("/merchants", handler.ListMerchants)
	router.GET("/merchants/:id", handler.GetMerchant)
	router.PUT("/merchants/:id", handler.UpdateMerchant)
	router.DELETE("/merchants/:id", handler.DeleteMerchant)
}