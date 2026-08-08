// Package health registers a simple liveness endpoint for PayLater services.
package health

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Register adds GET /health returning {"status":"ok"}.
func Register(router *gin.Engine) {
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})
}
