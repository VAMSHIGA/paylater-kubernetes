// Package handler contains HTTP handlers for Identity authentication APIs.
//
// Handlers bind and validate JSON, call AuthService for register/login business
// rules (including password hashing), and map results to HTTP status codes.
// They do not talk to MySQL directly.
package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"paylater/identity-service/internal/service"
	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
	"paylater/shared/response"
)

// AuthHandler handles HTTP requests related to authentication.
type AuthHandler struct {
	service *service.AuthService
}

// NewAuthHandler creates an AuthHandler wired to the given AuthService.
func NewAuthHandler(service *service.AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

// RegisterRequest represents JSON received from POST /auth/register.
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=customer merchant admin"`
}

// LoginRequest represents JSON received from POST /auth/login.
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// Register handles POST /auth/register.
//
// Validates email, password (min 6), and role (customer|merchant|admin), then
// rejects public admin self-registration before delegating to AuthService.
// Returns 201 on success.
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	if req.Role == constants.RoleAdmin {
		response.Error(
			c,
			http.StatusForbidden,
			platformerrors.ErrAdminSelfRegistrationNotAllowed.Error(),
		)
		return
	}

	err := h.service.Register(
		c.Request.Context(),
		req.Email,
		req.Password,
		req.Role,
	)

	if err != nil {
		if errors.Is(err, platformerrors.ErrAdminSelfRegistrationNotAllowed) {
			response.Error(c, http.StatusForbidden, err.Error())
			return
		}
		if errors.Is(err, service.ErrInvalidRegistrationRole) {
			response.ValidationError(c, err.Error())
			return
		}
		if errors.Is(err, service.ErrEmailAlreadyExists) {
			response.Error(c, http.StatusConflict, "email already registered")
			return
		}
		response.InternalError(c, err)
		return
	}

	response.SuccessMessage(c, http.StatusCreated, "User registered successfully")
}

// Login handles POST /auth/login.
//
// On success returns HTTP 200 with {"token": "<jwt>"}. Credential failures
// return 401 without revealing whether email or password was wrong.
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.ValidationError(c, err.Error())
		return
	}

	jwtToken, err := h.service.Login(
		c.Request.Context(),
		req.Email,
		req.Password,
	)

	if err != nil {
		response.Error(c, http.StatusUnauthorized, err.Error())
		return
	}

	response.JSON(c, http.StatusOK, gin.H{
		"token": jwtToken,
	})
}
