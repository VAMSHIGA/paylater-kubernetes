//go:build integration

package repository

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"paylater/payback-service/db/sqlc"
	"paylater/shared/creditlimit"
	platformerrors "paylater/shared/errors"
	"paylater/shared/integrationtest"
)

var (
	testEnv *integrationtest.Environment
	pbDate  = time.Date(2026, 8, 11, 0, 0, 0, 0, time.UTC)
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

func newPaybackRepo(t *testing.T) *Repository {
	t.Helper()

	db, err := testEnv.OpenServiceDB(integrationtest.PaybackDBName)
	if err != nil {
		t.Fatalf("open payback db: %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })

	return New(db)
}

func pbParams(customerID int64, amount string) sqlc.CreatePaybackParams {
	return sqlc.CreatePaybackParams{
		CustomerID:  customerID,
		Amount:      amount,
		PaymentDate: pbDate,
	}
}

func TestIntegration_Payback_AllowsRepaymentBelowRemainingDue(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")
	env.InsertPayback(t, customerID, "300.00")

	err := repo.CreatePayback(context.Background(), pbParams(customerID, "700.00"), true)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if got := env.RemainingDue(t, customerID); got != "0.00" {
		t.Fatalf("remaining due = %s, want 0.00", got)
	}
}

func TestIntegration_Payback_AllowsExactRemainingDue(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")

	err := repo.CreatePayback(context.Background(), pbParams(customerID, "1000.00"), true)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if got := env.RemainingDue(t, customerID); got != "0.00" {
		t.Fatalf("remaining due = %s, want 0.00", got)
	}
}

func TestIntegration_Payback_RejectsOverpaymentWithoutInsert(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")

	before := env.CountPaybacks(t, customerID)

	err := repo.CreatePayback(context.Background(), pbParams(customerID, "1001.00"), true)
	if !errors.Is(err, platformerrors.ErrPaybackExceedsRemainingDue) {
		t.Fatalf("expected ErrPaybackExceedsRemainingDue, got %v", err)
	}

	if after := env.CountPaybacks(t, customerID); after != before {
		t.Fatalf("payback count changed from %d to %d", before, after)
	}

	if got := env.RemainingDue(t, customerID); got != "1000.00" {
		t.Fatalf("remaining due = %s, want 1000.00", got)
	}
}

func TestIntegration_Payback_RejectsWhenRemainingDueIsZero(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")
	env.InsertPayback(t, customerID, "1000.00")

	before := env.CountPaybacks(t, customerID)

	err := repo.CreatePayback(context.Background(), pbParams(customerID, "1.00"), true)
	if !errors.Is(err, platformerrors.ErrPaybackExceedsRemainingDue) {
		t.Fatalf("expected ErrPaybackExceedsRemainingDue, got %v", err)
	}

	if after := env.CountPaybacks(t, customerID); after != before {
		t.Fatalf("payback count changed from %d to %d", before, after)
	}
}

func TestIntegration_Payback_RejectsZeroAmount(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")

	before := env.CountPaybacks(t, customerID)

	err := repo.CreatePayback(context.Background(), pbParams(customerID, "0"), true)
	if !errors.Is(err, platformerrors.ErrInvalidPaybackAmount) {
		t.Fatalf("expected ErrInvalidPaybackAmount, got %v", err)
	}

	if after := env.CountPaybacks(t, customerID); after != before {
		t.Fatalf("payback count changed from %d to %d", before, after)
	}
}

func TestIntegration_Payback_RejectsNegativeAmount(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")

	before := env.CountPaybacks(t, customerID)

	err := repo.CreatePayback(context.Background(), pbParams(customerID, "-10.00"), true)
	if !errors.Is(err, platformerrors.ErrInvalidPaybackAmount) {
		t.Fatalf("expected ErrInvalidPaybackAmount, got %v", err)
	}

	if after := env.CountPaybacks(t, customerID); after != before {
		t.Fatalf("payback count changed from %d to %d", before, after)
	}
}

func TestIntegration_ConcurrentPaybacks_RespectRemainingDue(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "1000.00")
	env.InsertPayback(t, customerID, "500.00")

	var wg sync.WaitGroup
	wg.Add(2)

	results := make(chan error, 2)
	start := make(chan struct{})

	for i := 0; i < 2; i++ {
		go func() {
			defer wg.Done()
			<-start
			results <- repo.CreatePayback(context.Background(), pbParams(customerID, "400.00"), true)
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
		case errors.Is(err, platformerrors.ErrPaybackExceedsRemainingDue):
			rejections++
		default:
			t.Fatalf("unexpected error: %v", err)
		}
	}

	if successes != 1 || rejections != 1 {
		t.Fatalf("expected 1 success and 1 rejection, got success=%d rejection=%d", successes, rejections)
	}

	if got := env.RemainingDue(t, customerID); got != "100.00" {
		t.Fatalf("remaining due = %s, want 100.00", got)
	}
}

func TestIntegration_AdvisoryLock_PaybackWaitsForHeldLock(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerID := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerID, "500.00")
	lockName := creditlimit.CustomerBalanceLockName(customerID)
	release := env.HoldCustomerLock(t, lockName)

	done := make(chan error, 1)
	go func() {
		done <- repo.CreatePayback(context.Background(), pbParams(customerID, "100.00"), true)
	}()

	time.Sleep(200 * time.Millisecond)
	release()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("expected payback after lock release, got %v", err)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("payback did not acquire shared customer lock within timeout")
	}
}

func TestIntegration_DifferentCustomers_DoNotBlockEachOther(t *testing.T) {
	env := requireEnv(t)
	repo := newPaybackRepo(t)

	customerA := env.CreateCustomer(t, "1000.00")
	customerB := env.CreateCustomer(t, "1000.00")
	env.InsertTransaction(t, customerA, "400.00")
	env.InsertTransaction(t, customerB, "400.00")

	lockName := creditlimit.CustomerBalanceLockName(customerA)
	release := env.HoldCustomerLock(t, lockName)
	t.Cleanup(release)

	done := make(chan error, 1)
	go func() {
		done <- repo.CreatePayback(context.Background(), pbParams(customerB, "100.00"), true)
	}()

	select {
	case err := <-done:
		if err != nil {
			t.Fatalf("expected customer B payback to succeed while A is locked, got %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("customer B payback was blocked by customer A lock")
	}
}
