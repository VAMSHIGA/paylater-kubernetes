package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"paylater/payback-service/db/sqlc"
	platformerrors "paylater/shared/errors"
)

type paybackRepoStub struct {
	enforceBalanceValidation bool
	createErr                error
}

func (s *paybackRepoStub) CustomerExists(context.Context, int64) (bool, error) {
	return true, nil
}

func (s *paybackRepoStub) CreatePayback(
	_ context.Context,
	_ sqlc.CreatePaybackParams,
	enforceBalanceValidation bool,
) error {
	s.enforceBalanceValidation = enforceBalanceValidation
	return s.createErr
}

func (s *paybackRepoStub) ListPaybacks(context.Context) ([]sqlc.Payback, error) {
	return []sqlc.Payback{{ID: 1}}, nil
}

func (s *paybackRepoStub) ListPaybacksByCustomerID(
	_ context.Context,
	customerID int64,
) ([]sqlc.Payback, error) {
	return []sqlc.Payback{{ID: 2, CustomerID: customerID}}, nil
}

func TestCreatePayback_EnforcesBalanceForCustomers(t *testing.T) {
	t.Parallel()

	repo := &paybackRepoStub{}
	svc := &PaybackService{repo: repo}

	params := sqlc.CreatePaybackParams{
		CustomerID:  1,
		Amount:      "10.00",
		PaymentDate: time.Now(),
	}

	err := svc.CreatePayback(context.Background(), params, "customer")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if !repo.enforceBalanceValidation {
		t.Fatal("expected balance validation for customer role")
	}
}

func TestCreatePayback_EnforcesBalanceForAdmins(t *testing.T) {
	t.Parallel()

	repo := &paybackRepoStub{}
	svc := &PaybackService{repo: repo}

	params := sqlc.CreatePaybackParams{
		CustomerID:  1,
		Amount:      "10.00",
		PaymentDate: time.Now(),
	}

	err := svc.CreatePayback(context.Background(), params, "admin")
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if !repo.enforceBalanceValidation {
		t.Fatal("expected balance validation for admin role")
	}
}

func TestCreatePayback_PropagatesExceedsRemainingDueError(t *testing.T) {
	t.Parallel()

	repo := &paybackRepoStub{
		createErr: platformerrors.ErrPaybackExceedsRemainingDue,
	}
	svc := &PaybackService{repo: repo}

	params := sqlc.CreatePaybackParams{
		CustomerID:  1,
		Amount:      "999.00",
		PaymentDate: time.Now(),
	}

	err := svc.CreatePayback(context.Background(), params, "customer")
	if !errors.Is(err, platformerrors.ErrPaybackExceedsRemainingDue) {
		t.Fatalf("expected ErrPaybackExceedsRemainingDue, got %v", err)
	}
}

func TestCreatePayback_PropagatesInvalidAmountError(t *testing.T) {
	t.Parallel()

	repo := &paybackRepoStub{
		createErr: platformerrors.ErrInvalidPaybackAmount,
	}
	svc := &PaybackService{repo: repo}

	params := sqlc.CreatePaybackParams{
		CustomerID:  1,
		Amount:      "0",
		PaymentDate: time.Now(),
	}

	err := svc.CreatePayback(context.Background(), params, "customer")
	if !errors.Is(err, platformerrors.ErrInvalidPaybackAmount) {
		t.Fatalf("expected ErrInvalidPaybackAmount, got %v", err)
	}
}

func TestCreatePayback_ReturnsCustomerNotFound(t *testing.T) {
	t.Parallel()

	repo := &customerMissingRepoStub{}
	svc := &PaybackService{repo: repo}

	params := sqlc.CreatePaybackParams{
		CustomerID:  99,
		Amount:      "10.00",
		PaymentDate: time.Now(),
	}

	err := svc.CreatePayback(context.Background(), params, "customer")
	if !errors.Is(err, ErrCustomerNotFound) {
		t.Fatalf("expected ErrCustomerNotFound, got %v", err)
	}
}

type customerMissingRepoStub struct{}

func (s *customerMissingRepoStub) CustomerExists(context.Context, int64) (bool, error) {
	return false, nil
}

func (s *customerMissingRepoStub) CreatePayback(
	context.Context,
	sqlc.CreatePaybackParams,
	bool,
) error {
	return nil
}

func (s *customerMissingRepoStub) ListPaybacks(context.Context) ([]sqlc.Payback, error) {
	return nil, nil
}

func (s *customerMissingRepoStub) ListPaybacksByCustomerID(context.Context, int64) ([]sqlc.Payback, error) {
	return nil, nil
}

func TestListPaybacks_CustomerUsesOwnedCustomerScope(t *testing.T) {
	t.Parallel()

	repo := &paybackRepoStub{}
	svc := &PaybackService{repo: repo}

	items, err := svc.ListPaybacks(context.Background(), "customer", 9)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if len(items) != 1 || items[0].CustomerID != 9 {
		t.Fatalf("unexpected items: %+v", items)
	}
}

func TestListPaybacks_AdminUsesGlobalScope(t *testing.T) {
	t.Parallel()

	repo := &paybackRepoStub{}
	svc := &PaybackService{repo: repo}

	items, err := svc.ListPaybacks(context.Background(), "admin", 0)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}
	if len(items) != 1 || items[0].ID != 1 {
		t.Fatalf("unexpected items: %+v", items)
	}
}
