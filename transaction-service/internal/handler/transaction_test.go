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

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
	"paylater/transaction-service/db/sqlc"
	"paylater/transaction-service/internal/service"
)

type handlerRepoStub struct {
	createErr          error
	enforceCreditLimit bool
}

func (s *handlerRepoStub) CustomerExists(context.Context, int64) (bool, error) {
	return true, nil
}

func (s *handlerRepoStub) MerchantExists(context.Context, int64) (bool, error) {
	return true, nil
}

func (s *handlerRepoStub) CreateTransaction(
	_ context.Context,
	_ sqlc.CreateTransactionParams,
	enforceCreditLimit bool,
) error {
	s.enforceCreditLimit = enforceCreditLimit
	return s.createErr
}

type stubOwnershipResolver struct {
	customerID int64
}

func (s stubOwnershipResolver) GetCustomerIDByUserID(context.Context, int64) (int64, error) {
	return s.customerID, nil
}

func TestCreateTransaction_ReturnsBadRequestWhenCreditLimitExceeded(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{createErr: platformerrors.ErrCreditLimitExceeded}
	handler := NewTransactionHandler(service.NewTransactionService(repo), stubOwnershipResolver{customerID: 1})

	router := gin.New()
	router.POST("/transactions", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleCustomer)
		c.Set(constants.ContextKeyUserID, int64(10))
		handler.CreateTransaction(c)
	})

	body, err := json.Marshal(map[string]any{
		"customer_id":      1,
		"merchant_id":      2,
		"amount":           "50.00",
		"commission":       "1.00",
		"transaction_date": "2026-08-11",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/transactions", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if !repo.enforceCreditLimit {
		t.Fatal("expected customer credit enforcement")
	}
}

func TestCreateTransaction_AdminBypassesCreditLimitEnforcement(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{}
	handler := NewTransactionHandler(service.NewTransactionService(repo), nil)

	router := gin.New()
	router.POST("/transactions", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleAdmin)
		c.Set(constants.ContextKeyUserID, int64(1))
		handler.CreateTransaction(c)
	})

	body, err := json.Marshal(map[string]any{
		"customer_id":      1,
		"merchant_id":      2,
		"amount":           "50.00",
		"commission":       "1.00",
		"transaction_date": "2026-08-11",
	})
	if err != nil {
		t.Fatalf("marshal body: %v", err)
	}

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/transactions", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d body=%s", recorder.Code, recorder.Body.String())
	}
	if repo.enforceCreditLimit {
		t.Fatal("expected admin to bypass credit limit enforcement")
	}
}

var _ = time.Now
