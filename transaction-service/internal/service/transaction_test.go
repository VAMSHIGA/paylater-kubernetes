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
