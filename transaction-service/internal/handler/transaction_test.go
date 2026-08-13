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

func (s *handlerRepoStub) ListTransactions(context.Context) ([]sqlc.Transaction, error) {
	return []sqlc.Transaction{
		{
			ID:              1,
			CustomerID:      2,
			MerchantID:      3,
			Amount:          "100.00",
			Commission:      "2.00",
			TransactionDate: time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC),
		},
	}, nil
}

func (s *handlerRepoStub) ListTransactionsByCustomerID(
	_ context.Context,
	customerID int64,
) ([]sqlc.Transaction, error) {
	return []sqlc.Transaction{
		{
			ID:              5,
			CustomerID:      customerID,
			MerchantID:      3,
			Amount:          "300.00",
			Commission:      "2.00",
			TransactionDate: time.Date(2026, 8, 12, 0, 0, 0, 0, time.UTC),
		},
	}, nil
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

func TestListTransactions_CustomerSeesOwnedTransactionsOnly(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{}
	handler := NewTransactionHandler(service.NewTransactionService(repo), stubOwnershipResolver{customerID: 7})

	router := gin.New()
	router.GET("/transactions", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleCustomer)
		c.Set(constants.ContextKeyUserID, int64(10))
		handler.ListTransactions(c)
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/transactions", nil)
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}

	var items []TransactionResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &items); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(items) != 1 || items[0].CustomerID != 7 || items[0].Amount != "300.00" {
		t.Fatalf("unexpected items: %+v", items)
	}
}

func TestListTransactions_AdminSeesAllTransactions(t *testing.T) {
	gin.SetMode(gin.TestMode)

	repo := &handlerRepoStub{}
	handler := NewTransactionHandler(service.NewTransactionService(repo), nil)

	router := gin.New()
	router.GET("/transactions", func(c *gin.Context) {
		c.Set(constants.ContextKeyRole, constants.RoleAdmin)
		c.Set(constants.ContextKeyUserID, int64(1))
		handler.ListTransactions(c)
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/transactions", nil)
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%s", recorder.Code, recorder.Body.String())
	}

	var items []TransactionResponse
	if err := json.Unmarshal(recorder.Body.Bytes(), &items); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if len(items) != 1 || items[0].ID != 1 {
		t.Fatalf("unexpected items: %+v", items)
	}
}

var _ = time.Now
