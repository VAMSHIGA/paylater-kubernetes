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

func (s *handlerRepoStub) ListPaybacks(context.Context) ([]sqlc.Payback, error) {
	return []sqlc.Payback{
		{
			ID:          1,
			CustomerID:  2,
			Amount:      "50.00",
			PaymentDate: time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC),
		},
	}, nil
}

func (s *handlerRepoStub) ListPaybacksByCustomerID(
	_ context.Context,
	customerID int64,
) ([]sqlc.Payback, error) {
	return []sqlc.Payback{
		{
			ID:          4,
			CustomerID:  customerID,
			Amount:      "100.00",
			PaymentDate: time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC),
		},
	}, nil
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

func TestCreatePayback_AdminEnforcesBalanceValidation(t *testing.T) {
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
	if !repo.enforceBalanceValidation {
		t.Fatal("expected admin balance enforcement")
	}
}

func TestListPaybacks_CustomerSeesOwnedPaybacksOnly(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{}
	handler := NewPaybackHandler(service.NewPaybackService(repo), stubOwnershipResolver{customerID: 7})

	router := gin.New()
	router.GET("/paybacks", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleCustomer)
		c.Set(constants.ContextKeyUserID, int64(10))
		handler.ListPaybacks(c)
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/paybacks", nil)
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}

	var items []PaybackResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &items); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(items) != 1 || items[0].CustomerID != 7 || items[0].Amount != "100.00" {
		t.Fatalf("unexpected items: %+v", items)
	}
}

func TestListPaybacks_AdminSeesAllPaybacks(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{}
	handler := NewPaybackHandler(service.NewPaybackService(repo), nil)

	router := gin.New()
	router.GET("/paybacks", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleAdmin)
		c.Set(constants.ContextKeyUserID, int64(1))
		handler.ListPaybacks(c)
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/paybacks", nil)
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}

	var items []PaybackResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &items); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(items) != 1 || items[0].ID != 1 {
		t.Fatalf("unexpected items: %+v", items)
	}
}

var _ = time.Now
