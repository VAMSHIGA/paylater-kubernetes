package routes

import (
	"github.com/gin-gonic/gin"

	"paylater/handlers"
)

// ==========================================================
// Authentication Routes
// ==========================================================
// This function connects authentication URLs
// with functions inside AuthHandler.
//
// We currently have two authentication APIs:
//
// POST /auth/register
//      Creates a new user account.
//
// POST /auth/login
//      Checks email and password.
//      If credentials are correct, it returns a JWT token.
//
func AuthRoutes(
	router *gin.Engine,
	handler *handlers.AuthHandler,
) {

	// ======================================================
	// Create Auth Route Group
	// ======================================================
	// Instead of writing:
	//
	// /auth/register
	// /auth/login
	//
	// separately every time, we create an "/auth" group.
	auth := router.Group("/auth")

	// ======================================================
	// Register User
	// ======================================================
	// Full API:
	//
	// POST /auth/register
	//
	// Example request:
	//
	// {
	//     "email": "admin@gmail.com",
	//     "password": "password123",
	//     "role": "admin"
	// }
	//
	// This calls:
	// AuthHandler.Register()
	auth.POST("/register", handler.Register)

	// ======================================================
	// Login User
	// ======================================================
	// Full API:
	//
	// POST /auth/login
	//
	// Example request:
	//
	// {
	//     "email": "admin@gmail.com",
	//     "password": "password123"
	// }
	//
	// If login is successful,
	// the API returns a JWT token.
	//
	// This calls:
	// AuthHandler.Login()
	auth.POST("/login", handler.Login)
}