// Package response provides stable JSON helpers matching PayLater API contracts.
//
// Handlers use these helpers so error and success envelopes stay consistent:
//   - errors:   {"error": "<message>"}
//   - messages: {"message": "<message>"}
//
// Do not change these shapes without updating every client and service contract.
package response

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Error writes a JSON error response: {"error": "<message>"}.
func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"error": message,
	})
}

// SuccessMessage writes a JSON success response: {"message": "<message>"}.
func SuccessMessage(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"message": message,
	})
}

// ValidationError writes a 400 JSON error from binding/validation failures.
func ValidationError(c *gin.Context, message string) {
	Error(c, http.StatusBadRequest, message)
}

// JSON writes arbitrary JSON with the given status code (lists, tokens, reports).
func JSON(c *gin.Context, status int, payload interface{}) {
	c.JSON(status, payload)
}

// InternalError logs the underlying error and returns a generic 500 response.
func InternalError(c *gin.Context, err error) {
	log.Printf("internal error: %v", err)
	Error(c, http.StatusInternalServerError, "internal server error")
}
