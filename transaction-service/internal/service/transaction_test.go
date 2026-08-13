package service

import (
	"context"
	"errors"
	"testing"
	"time"

	platformerrors "paylater/shared/errors"
	"paylater/transaction-service/db/sqlc"
)

type transactionRepoStub struct {
	enforceCreditLimit bool
	callerRole         string
	createErr          error
}

func (s *transactionRepoStub) CustomerExists(context.Context, int64) (bool, error) {
	return true, nil
}

func (s *transactionRepoStub) MerchantExists(context.Context, int64) (bool, error) {
	return true, nil
}

func (s *transactionRepoStub) CreateTransaction(
	_ context.Context,
	_ sqlc.CreateTransactionParams,
	enforceCreditLimit bool,
) error {
	s.enforceCreditLimit = enforceCreditLimit
	return s.createErr
}

func (s *transactionRepoStub) ListTransactions(context.Context) ([]sqlc.Transaction, error) {
	return []sqlc.Transaction{{ID: 1}}, nil
}

func (s *transactionRepoStub) ListTransactionsByCustomerID(
	_ context.Context,
	customerID int64,
) ([]sqlc.Transaction, error) {
	return []sqlc.Transaction{{ID: 2, CustomerID: customerID}}, nil
}

func TestCreateTransaction_EnforcesCreditLimitForCustomers(t *testing.T) {
	t.Parallel()

	repo := &transactionRepoStub{}
	svc := &TransactionService{repo: repo}

	params := sqlc.CreateTransactionParams{
		CustomerID:      1,
		MerchantID:      2,
		Amount:          "10.00",
		Commission:      "1.00",
		TransactionDate: time.Now(),
	}

	err := svc.CreateTransaction(context.Background(), params, "customer")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if !repo.enforceCreditLimit {
		t.Fatal("expected credit limit enforcement for customer role")
	}
}

func TestCreateTransaction_SkipsCreditLimitForAdmins(t *testing.T) {
	t.Parallel()

	repo := &transactionRepoStub{}
	svc := &TransactionService{repo: repo}

	params := sqlc.CreateTransactionParams{
		CustomerID:      1,
		MerchantID:      2,
		Amount:          "10.00",
		Commission:      "1.00",
		TransactionDate: time.Now(),
	}

	err := svc.CreateTransaction(context.Background(), params, "admin")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if repo.enforceCreditLimit {
		t.Fatal("expected admin to bypass credit limit enforcement")
	}
}

func TestCreateTransaction_PropagatesCreditLimitError(t *testing.T) {
	t.Parallel()

	repo := &transactionRepoStub{
		createErr: platformerrors.ErrCreditLimitExceeded,
	}
	svc := &TransactionService{repo: repo}

	params := sqlc.CreateTransactionParams{
		CustomerID:      1,
		MerchantID:      2,
		Amount:          "999.00",
		Commission:      "1.00",
		TransactionDate: time.Now(),
	}

	err := svc.CreateTransaction(context.Background(), params, "customer")
	if !errors.Is(err, platformerrors.ErrCreditLimitExceeded) {
		t.Fatalf("expected ErrCreditLimitExceeded, got %v", err)
	}
}

func TestListTransactions_CustomerUsesOwnedCustomerScope(t *testing.T) {
	t.Parallel()

	repo := &transactionRepoStub{}
	svc := &TransactionService{repo: repo}

	items, err := svc.ListTransactions(context.Background(), "customer", 9)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if len(items) != 1 || items[0].CustomerID != 9 {
		t.Fatalf("unexpected items: %+v", items)
	}
}

func TestListTransactions_AdminUsesGlobalScope(t *testing.T) {
	t.Parallel()

	repo := &transactionRepoStub{}
	svc := &TransactionService{repo: repo}

	items, err := svc.ListTransactions(context.Background(), "admin", 0)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if len(items) != 1 || items[0].ID != 1 {
		t.Fatalf("unexpected items: %+v", items)
	}
}
