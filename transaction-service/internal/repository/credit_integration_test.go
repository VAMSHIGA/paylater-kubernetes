//go:build integration

package repository

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"paylater/shared/creditlimit"
	platformerrors "paylater/shared/errors"
	"paylater/shared/integrationtest"
	"paylater/transaction-service/db/sqlc"
)

var (
	testEnv *integrationtest.Environment
	txDate  = time.Date(2026, 8, 11, 0, 0, 0, 0, time.UTC)
)

func TestMain(m *testing.M) {
	env, err := integrationtest.Setup()
	if err == nil {
		testEnv = env
		integrationtest.ConfigureRepositoryEnv()
	}

	m.Run()
}

func requireEnv(t *testing.T) *integrationtest.Environment {
	t.Helper()
	if testEnv == nil {
		t.Skip("MySQL integration environment unavailable")
	}
	integrationtest.ConfigureRepositoryEnv()
	return testEnv
}

func newTransactionRepo(t *testing.T) *Repository {
	t.Helper()

	db, err := testEnv.OpenServiceDB(integrationtest.TransactionDBName)
	if err != nil {
		t.Fatalf("open transaction db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	return New(db)
}

func txParams(customerID int64, amount string) sqlc.CreateTransactionParams {
	return sqlc.CreateTransactionParams{
		CustomerID:      customerID,
		MerchantID:      1,
		Amount:          amount,
		Commission:      "1.00",
		TransactionDate: txDate,
	}
}

func TestIntegration_CreditLimit_AllowsTransactionAtExactAvailableCredit(t *testing.T) {
	env := requireEnv(t)
	repo := newTransactionRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "700.00")

	err := repo.CreateTransaction(context.Background(), txParams(customerID, "300.00"), true)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if got := env.RemainingDue(t, customerID); got != "1000.00" {
		t.Fatalf("remaining due = %s, want 1000.00", got)
	}
}

func TestIntegration_CreditLimit_RejectsTransactionExceedingAvailableCredit(t *testing.T) {
	env := requireEnv(t)
	repo := newTransactionRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "900.00")

	err := repo.CreateTransaction(context.Background(), txParams(customerID, "101.00"), true)
	if !errors.Is(err, platformerrors.ErrCreditLimitExceeded) {
		t.Fatalf("expected ErrCreditLimitExceeded, got %v", err)
	}

	if got := env.RemainingDue(t, customerID); got != "900.00" {
		t.Fatalf("remaining due = %s, want 900.00", got)
	}
}

func TestIntegration_CreditLimit_RestoredCreditAfterPayback(t *testing.T) {
	env := requireEnv(t)
	repo := newTransactionRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "800.00")
	env.InsertPayback(t, customerID, "300.00")

	if got := env.RemainingDue(t, customerID); got != "500.00" {
		t.Fatalf("remaining due after payback = %s, want 500.00", got)
	}

	err := repo.CreateTransaction(context.Background(), txParams(customerID, "500.00"), true)
	if err != nil {
		t.Fatalf("expected restored-credit transaction to succeed, got %v", err)
	}

	err = repo.CreateTransaction(context.Background(), txParams(customerID, "1.00"), true)
	if !errors.Is(err, platformerrors.ErrCreditLimitExceeded) {
		t.Fatalf("expected ErrCreditLimitExceeded after using restored credit, got %v", err)
	}

	if got := env.RemainingDue(t, customerID); got != "1000.00" {
		t.Fatalf("remaining due = %s, want 1000.00", got)
	}
}

func TestIntegration_AdvisoryLock_TransactionWaitsForHeldLock(t *testing.T) {
	env := requireEnv(t)
	repo := newTransactionRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	lockName := creditlimit.CustomerBalanceLockName(customerID)
	release := env.HoldCustomerLock(t, lockName)

	done := make(chan error, 1)
	go func() {
		done <- repo.CreateTransaction(context.Background(), txParams(customerID, "100.00"), true)
	}()

	time.Sleep(200 * time.Millisecond)
	release()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("expected transaction after lock release, got %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("transaction did not acquire shared customer lock within timeout")
	}
}

func TestIntegration_ConcurrentTransactions_RespectCreditLimit(t *testing.T) {
	env := requireEnv(t)
	repo := newTransactionRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "800.00")

	var wg sync.WaitGroup
	wg.Add(2)

	results := make(chan error, 2)
	start := make(chan struct{})

	for _, amount := range []string{"150.00", "150.00"} {
		amount := amount
		go func() {
			defer wg.Done()
			<-start
			results <- repo.CreateTransaction(context.Background(), txParams(customerID, amount), true)
		}()
	}

	close(start)
	wg.Wait()
	close(results)

	var successes int
	var rejections int
	for err := range results {
		switch {
		case err == nil:
			successes++
		case errors.Is(err, platformerrors.ErrCreditLimitExceeded):
			rejections++
		default:
			t.Fatalf("unexpected error: %v", err)
		}
	}

	if successes != 1 || rejections != 1 {
		t.Fatalf("expected 1 success and 1 rejection, got success=%d rejection=%d", successes, rejections)
	}

	if got := env.RemainingDue(t, customerID); got != "950.00" {
		t.Fatalf("remaining due = %s, want 950.00", got)
	}
}
