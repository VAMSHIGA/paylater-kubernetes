package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/services"
)

// ==========================================================
// Auth Handler
// ==========================================================
// AuthHandler handles HTTP requests related to
// authentication.
//
// Authentication means:
// "Who is the user?"
//
// This handler currently provides:
//
// POST /auth/register
// POST /auth/login
//
// Flow:
//
// Client / Postman
//
//	↓
//
// Auth Routes
//
//	↓
//
// Auth Handler
//
//	↓
//
// Auth Service
//
//	↓
//
// SQLC / JWT
type AuthHandler struct {
	service *services.AuthService
}

// ==========================================================
// Create Auth Handler
// ==========================================================
// NewAuthHandler creates an AuthHandler.
//
// We pass AuthService into the handler because
// the handler should not directly communicate
// with the database.
//
// Handler
//
//	↓
//
// Service
//
//	↓
//
// SQLC
//
//	↓
//
// MySQL
func NewAuthHandler(
	service *services.AuthService,
) *AuthHandler {

	return &AuthHandler{
		service: service,
	}
}

// ==========================================================
// Register Request
// ==========================================================
// RegisterRequest represents JSON received from:
//
// POST /auth/register
//
// Example:
//
//	{
//	    "email": "customer@gmail.com",
//	    "password": "password123",
//	    "role": "customer"
//	}
//
// Validation:
//
// Email:
// - Required
// - Must be a valid email
//
// Password:
// - Required
// - Minimum 6 characters
//
// Role:
// - Required
// - Must be "customer" or "merchant"
//
// IMPORTANT:
//
// Public users are NOT allowed to register themselves
// with the "admin" role.
//
// Admin accounts should be created separately by
// an authorised administrator/system.
type RegisterRequest struct {
	Email string `json:"email" binding:"required,email"`

	Password string `json:"password" binding:"required,min=6"`

	Role string `json:"role" binding:"required,oneof=customer merchant"`
}

// ==========================================================
// Login Request
// ==========================================================
// LoginRequest represents JSON received from:
//
// POST /auth/login
//
// Example:
//
//	{
//	    "email": "customer@gmail.com",
//	    "password": "password123"
//	}
//
// We don't need the role during login.
//
// The role is read from the users table after
// finding the user by email.
type LoginRequest struct {
	Email string `json:"email" binding:"required,email"`

	Password string `json:"password" binding:"required"`
}

// ==========================================================
// Register User
// ==========================================================
// API:
//
// POST /auth/register
//
// Purpose:
//
// Creates a new user account.
//
// Example Request:
//
//	{
//	    "email": "customer@gmail.com",
//	    "password": "password123",
//	    "role": "customer"
//	}
//
// Complete Flow:
//
// POST /auth/register
//
//	↓
//
// AuthHandler.Register()
//
//	↓
//
// Validate JSON
//
//	↓
//
// AuthService.Register()
//
//	↓
//
// bcrypt hashes password
//
//	↓
//
// SQLC CreateUser()
//
//	↓
//
// MySQL users table
func (h *AuthHandler) Register(c *gin.Context) {

	// ======================================================
	// STEP 1: Create Request Variable
	// ======================================================
	// req will store the JSON sent by the client.
	//
	var req RegisterRequest

	// ======================================================
	// STEP 2: Read and Validate JSON
	// ======================================================
	// ShouldBindJSON performs two jobs:
	//
	// 1. Reads JSON request body
	// 2. Validates the binding rules
	//
	// For example:
	//
	// required
	// email
	// min=6
	// oneof=customer merchant
	//
	if err := c.ShouldBindJSON(&req); err != nil {

		// If JSON or validation fails,
		// return HTTP 400 Bad Request.
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ======================================================
	// STEP 3: Call Auth Service
	// ======================================================
	// Pass registration information to AuthService.
	//
	// We send:
	//
	// email
	// password
	// role
	//
	// AuthService will hash the password before
	// storing it in MySQL.
	//
	err := h.service.Register(
		c.Request.Context(),
		req.Email,
		req.Password,
		req.Role,
	)

	// ======================================================
	// STEP 4: Handle Registration Error
	// ======================================================
	// Registration could fail because of problems such as:
	//
	// - Duplicate email
	// - Database error
	// - Password hashing error
	//
	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ======================================================
	// STEP 5: Registration Successful
	// ======================================================
	// HTTP 201 Created means a new resource
	// was successfully created.
	//
	c.JSON(http.StatusCreated, gin.H{
		"message": "User registered successfully",
	})
}

// ==========================================================
// Login User
// ==========================================================
// API:
//
// POST /auth/login
//
// Purpose:
//
// Authenticates an existing user.
//
// Example Request:
//
//	{
//	    "email": "customer@gmail.com",
//	    "password": "password123"
//	}
//
// Complete Flow:
//
// POST /auth/login
//
//	↓
//
// AuthHandler.Login()
//
//	↓
//
// Validate JSON
//
//	↓
//
// AuthService.Login()
//
//	↓
//
// GetUserByEmail()
//
//	↓
//
// MySQL users table
//
//	↓
//
// bcrypt compares password
//
//	↓
//
// Password correct?
//
//	 ┌───────┴────────┐
//	 │                │
//	NO               YES
//	 │                │
//	401          Generate JWT
//	                  │
//	                  ↓
//	             Return Token
func (h *AuthHandler) Login(c *gin.Context) {

	// ======================================================
	// STEP 1: Create Login Request Variable
	// ======================================================
	// req stores email and password received
	// from the client.
	//
	var req LoginRequest

	// ======================================================
	// STEP 2: Read and Validate JSON
	// ======================================================
	if err := c.ShouldBindJSON(&req); err != nil {

		// Invalid request.
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ======================================================
	// STEP 3: Call Auth Service
	// ======================================================
	// AuthService.Login() performs:
	//
	// 1. Find user using email
	//
	// 2. Get password_hash from database
	//
	// 3. Compare entered password with bcrypt hash
	//
	// 4. Generate JWT if credentials are correct
	//
	jwtToken, err := h.service.Login(
		c.Request.Context(),
		req.Email,
		req.Password,
	)

	// ======================================================
	// STEP 4: Handle Invalid Login
	// ======================================================
	// If email doesn't exist or password is incorrect,
	// authentication fails.
	//
	// HTTP 401 = Unauthorized
	//
	if err != nil {

		c.JSON(http.StatusUnauthorized, gin.H{
			"error": err.Error(),
		})

		return
	}

	// ======================================================
	// STEP 5: Login Successful
	// ======================================================
	// Return the JWT token to the client.
	//
	// Example response:
	//
	// {
	//     "token": "eyJhbGciOiJIUzI1Ni..."
	// }
	//
	// The client should use this token for
	// protected APIs.
	//
	// Example:
	//
	// Authorization: Bearer <JWT_TOKEN>
	//
	c.JSON(http.StatusOK, gin.H{
		"token": jwtToken,
	})
}
