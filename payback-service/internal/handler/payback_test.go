package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/payback-service/db/sqlc"
	"paylater/payback-service/internal/service"
	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
)

type handlerRepoStub struct {
	createErr                error
	enforceBalanceValidation bool
	customerExists           bool
}

func (s *handlerRepoStub) CustomerExists(context.Context, int64) (bool, error) {
	return s.customerExists || true, nil
}

func (s *handlerRepoStub) CreatePayback(
	_ context.Context,
	_ sqlc.CreatePaybackParams,
	enforceBalanceValidation bool,
) error {
	s.enforceBalanceValidation = enforceBalanceValidation
	return s.createErr
}

type stubOwnershipResolver struct {
	customerID int64
}

func (s stubOwnershipResolver) GetCustomerIDByUserID(context.Context, int64) (int64, error) {
	return s.customerID, nil
}

func TestCreatePayback_ReturnsBadRequestWhenExceedsRemainingDue(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{createErr: platformerrors.ErrPaybackExceedsRemainingDue}
	handler := NewPaybackHandler(service.NewPaybackService(repo), stubOwnershipResolver{customerID: 1})

	router := gin.New()
	router.POST("/paybacks", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleCustomer)
		c.Set(constants.ContextKeyUserID, int64(10))
		handler.CreatePayback(c)
	})

	body, err := json.Marshal(map[string]any{
		"customer_id":  1,
		"amount":       "50.00",
		"payment_date": "2026-08-11",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/paybacks", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !repo.enforceBalanceValidation {
		t.Fatal("expected customer balance enforcement")
	}
}

func TestCreatePayback_ReturnsBadRequestForInvalidAmount(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{createErr: platformerrors.ErrInvalidPaybackAmount}
	handler := NewPaybackHandler(service.NewPaybackService(repo), stubOwnershipResolver{customerID: 1})

	router := gin.New()
	router.POST("/paybacks", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleCustomer)
		c.Set(constants.ContextKeyUserID, int64(10))
		handler.CreatePayback(c)
	})

	body, err := json.Marshal(map[string]any{
		"customer_id":  1,
		"amount":       "0",
		"payment_date": "2026-08-11",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/paybacks", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", recorder.Code, recorder.Body.String())
	}
}

func TestCreatePayback_AdminBypassesBalanceValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{}
	handler := NewPaybackHandler(service.NewPaybackService(repo), nil)

	router := gin.New()
	router.POST("/paybacks", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleAdmin)
		c.Set(constants.ContextKeyUserID, int64(1))
		handler.CreatePayback(c)
	})

	body, err := json.Marshal(map[string]any{
		"customer_id":  1,
		"amount":       "50.00",
		"payment_date": "2026-08-11",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/paybacks", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if repo.enforceBalanceValidation {
		t.Fatal("expected admin to bypass balance validation")
	}
}

var _ = time.Now
