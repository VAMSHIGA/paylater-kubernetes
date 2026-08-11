package customerauth

import (
	"context"
	"errors"
	"testing"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
)

type stubResolver struct {
	customerID int64
	err        error
}

func (s stubResolver) GetCustomerIDByUserID(_ context.Context, _ int64) (int64, error) {
	if s.err != nil {
		return 0, s.err
	}
	return s.customerID, nil
}

func TestEnforceCustomerAccess_AdminBypass(t *testing.T) {
	err := EnforceCustomerAccess(
		context.Background(),
		constants.RoleAdmin,
		1,
		99,
		stubResolver{customerID: 2},
	)
	if err != nil {
		t.Fatalf("expected admin bypass, got %v", err)
	}
}

func TestEnforceCustomerAccess_CustomerOwnsCustomerID(t *testing.T) {
	err := EnforceCustomerAccess(
		context.Background(),
		constants.RoleCustomer,
		10,
		5,
		stubResolver{customerID: 5},
	)
	if err != nil {
		t.Fatalf("expected allow, got %v", err)
	}
}

func TestEnforceCustomerAccess_CustomerDoesNotOwnCustomerID(t *testing.T) {
	err := EnforceCustomerAccess(
		context.Background(),
		constants.RoleCustomer,
		10,
		99,
		stubResolver{customerID: 5},
	)
	if !errors.Is(err, platformerrors.ErrNotAuthorized) {
		t.Fatalf("expected ErrNotAuthorized, got %v", err)
	}
}

func TestEnforceCustomerAccess_NoLinkedCustomer(t *testing.T) {
	err := EnforceCustomerAccess(
		context.Background(),
		constants.RoleCustomer,
		10,
		1,
		stubResolver{err: ErrNoLinkedCustomer},
	)
	if !errors.Is(err, ErrNoLinkedCustomer) {
		t.Fatalf("expected ErrNoLinkedCustomer, got %v", err)
	}
}

func TestEnforceCustomerAccess_MerchantBypass(t *testing.T) {
	err := EnforceCustomerAccess(
		context.Background(),
		constants.RoleMerchant,
		1,
		99,
		stubResolver{customerID: 2},
	)
	if err != nil {
		t.Fatalf("expected merchant bypass, got %v", err)
	}
}
