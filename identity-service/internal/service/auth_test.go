package service

import (
	"context"
	"errors"
	"testing"

	platformerrors "paylater/shared/errors"
)

func TestRegister_RejectsAdminRole(t *testing.T) {
	t.Parallel()

	svc := NewAuthService(nil)

	err := svc.Register(context.Background(), "admin@test.example", "secret12", "admin")
	if !errors.Is(err, platformerrors.ErrAdminSelfRegistrationNotAllowed) {
		t.Fatalf("expected ErrAdminSelfRegistrationNotAllowed, got %v", err)
	}
}

func TestRegister_RejectsInvalidRole(t *testing.T) {
	t.Parallel()

	svc := NewAuthService(nil)

	err := svc.Register(context.Background(), "user@test.example", "secret12", "superuser")
	if !errors.Is(err, ErrInvalidRegistrationRole) {
		t.Fatalf("expected ErrInvalidRegistrationRole, got %v", err)
	}
}
