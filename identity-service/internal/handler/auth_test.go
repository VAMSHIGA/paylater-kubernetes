package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"paylater/identity-service/internal/service"
)

func TestRegister_RejectsAdminRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewAuthHandler(service.NewAuthService(nil))
	router := gin.New()
	router.POST("/auth/register", handler.Register)

	body, err := json.Marshal(map[string]string{
		"email":    "admin@test.example",
		"password": "secret12",
		"role":     "admin",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestRegister_RejectsInvalidRole(t *testing.T) {
	gin.SetMode(gin.TestMode)

	handler := NewAuthHandler(service.NewAuthService(nil))
	router := gin.New()
	router.POST("/auth/register", handler.Register)

	body, err := json.Marshal(map[string]string{
		"email":    "user@test.example",
		"password": "secret12",
		"role":     "superuser",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/auth/register", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}
