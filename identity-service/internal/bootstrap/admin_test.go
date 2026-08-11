package bootstrap

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"paylater/identity-service/db/sqlc"
	"paylater/shared/constants"
)

type bootstrapRepoStub struct {
	users   map[string]sqlc.User
	created []sqlc.CreateUserParams
}

func (s *bootstrapRepoStub) GetUserByEmail(_ context.Context, email string) (sqlc.User, error) {
	user, ok := s.users[email]
	if !ok {
		return sqlc.User{}, sql.ErrNoRows
	}
	return user, nil
}

func (s *bootstrapRepoStub) CreateUser(_ context.Context, params sqlc.CreateUserParams) (sql.Result, error) {
	s.created = append(s.created, params)
	s.users[params.Email] = sqlc.User{
		Email:        params.Email,
		PasswordHash: params.PasswordHash,
		Role:         params.Role,
	}
	return fakeResult{lastID: int64(len(s.users))}, nil
}

type fakeResult struct {
	lastID int64
}

func (f fakeResult) LastInsertId() (int64, error) { return f.lastID, nil }
func (f fakeResult) RowsAffected() (int64, error) { return 1, nil }

func TestCreateAdmin_CreatesBcryptHashedAdmin(t *testing.T) {
	t.Parallel()

	repo := &bootstrapRepoStub{users: map[string]sqlc.User{}}
	password := "secret12"

	err := CreateAdmin(context.Background(), repo, "admin@test.example", password)
	if err != nil {
		t.Fatalf("expected success, got %v", err)
	}

	if len(repo.created) != 1 {
		t.Fatalf("expected one created user, got %d", len(repo.created))
	}

	created := repo.created[0]
	if created.Role != constants.RoleAdmin {
		t.Fatalf("role = %q, want admin", created.Role)
	}
	if created.Email != "admin@test.example" {
		t.Fatalf("email = %q", created.Email)
	}
	if strings.Contains(created.PasswordHash, password) {
		t.Fatal("password hash must not contain plaintext password")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(created.PasswordHash), []byte(password)); err != nil {
		t.Fatalf("expected bcrypt hash to match password: %v", err)
	}
}

func TestCreateAdmin_RejectsDuplicateEmail(t *testing.T) {
	t.Parallel()

	repo := &bootstrapRepoStub{
		users: map[string]sqlc.User{
			"admin@test.example": {Email: "admin@test.example", Role: constants.RoleCustomer},
		},
	}

	err := CreateAdmin(context.Background(), repo, "admin@test.example", "secret12")
	if !errors.Is(err, ErrAdminUserAlreadyExists) {
		t.Fatalf("expected ErrAdminUserAlreadyExists, got %v", err)
	}
	if len(repo.created) != 0 {
		t.Fatal("expected no user creation on duplicate email")
	}
}

func TestCreateAdmin_RejectsInvalidEmail(t *testing.T) {
	t.Parallel()

	repo := &bootstrapRepoStub{users: map[string]sqlc.User{}}

	err := CreateAdmin(context.Background(), repo, "not-an-email", "secret12")
	if !errors.Is(err, ErrInvalidEmail) {
		t.Fatalf("expected ErrInvalidEmail, got %v", err)
	}
}

func TestCreateAdmin_RejectsShortPassword(t *testing.T) {
	t.Parallel()

	repo := &bootstrapRepoStub{users: map[string]sqlc.User{}}

	err := CreateAdmin(context.Background(), repo, "admin@test.example", "short")
	if !errors.Is(err, ErrInvalidPassword) {
		t.Fatalf("expected ErrInvalidPassword, got %v", err)
	}
}

func TestCreateAdmin_DoesNotReturnPassword(t *testing.T) {
	t.Parallel()

	message := SuccessMessage("admin@test.example")
	if strings.Contains(message, "secret") {
		t.Fatal("success message must not include password material")
	}
}
