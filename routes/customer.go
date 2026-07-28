package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
)

func CustomerRoutes(router *gin.Engine, handler *handlers.CustomerHandler) {

	router.POST("/customers", handler.CreateCustomer)

	router.GET("/customers", handler.ListCustomers)

	router.GET("/customers/:id", handler.GetCustomer)

	router.PUT("/customers/:id", handler.UpdateCustomer)

	router.DELETE("/customers/:id", handler.DeleteCustomer)
}