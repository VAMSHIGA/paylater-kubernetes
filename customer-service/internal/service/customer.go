// Package service implements Customer domain operations.
//
// Today the layer is intentionally thin (persist and list) so credit-limit and
// reporting rules stay in Reporting Service rather than being duplicated here.
package service

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"paylater/customer-service/db/sqlc"
	"paylater/customer-service/internal/config"
	"paylater/customer-service/internal/repository"
	"paylater/shared/balance"
	"paylater/shared/customerauth"
)

// ErrIdentityCustomerNotFound is returned when POST /customers omits user_id and
// no identity_db.users row exists with the same email and role=customer.
var ErrIdentityCustomerNotFound = errors.New("no customer identity user found for email")

// customerRepository is the persistence dependency for CustomerService.
type customerRepository interface {
	LookupCustomerUserIDByEmail(ctx context.Context, email string) (sql.NullInt64, error)
	LookupIdentityUserByID(ctx context.Context, userID int64) (string, error)
	CreateCustomer(ctx context.Context, params sqlc.CreateCustomerParams) (sql.Result, error)
	ListCustomers(ctx context.Context) ([]sqlc.Customer, error)
	GetCustomerByUserID(ctx context.Context, userID int64) (sqlc.Customer, error)
	GetCustomerBalance(ctx context.Context, customerID int64) (balance.CustomerBalanceResult, error)
}

// CustomerProfile is the authenticated customer's profile with balance metrics.
type CustomerProfile struct {
	Customer        sqlc.Customer
	OutstandingDue  string
	AvailableCredit string
}

// CustomerService contains all business logic related to customers.
type CustomerService struct {
	repo               customerRepository
	defaultCreditLimit string
}

// NewCustomerService creates a new CustomerService. constructor to create a objects
func NewCustomerService(repo *repository.Repository) *CustomerService {
	return &CustomerService{
		repo:               repo,
		defaultCreditLimit: config.LoadDefaultCustomerCreditLimit(),
	}
}

// CreateCustomer creates a new customer in the database.
//
// When user_id is not provided, the service resolves identity_db.users.id for a
// customer-role account with the same email and stores it as customers.user_id.
// Missing identity users are rejected (they are not silently stored as NULL).
func (s *CustomerService) CreateCustomer(
	ctx context.Context,
	params sqlc.CreateCustomerParams,
) error {
	if !params.UserID.Valid {
		userID, err := s.repo.LookupCustomerUserIDByEmail(ctx, params.Email)
		if err != nil {
			return err
		}
		if !userID.Valid {
			return ErrIdentityCustomerNotFound
		}
		params.UserID = userID
	}

	_, err := s.repo.CreateCustomer(ctx, params)
	if err != nil {
		return err
	}

	return nil
}

// ListCustomers retrieves all customers from the database.
func (s *CustomerService) ListCustomers(
	ctx context.Context,
) ([]sqlc.Customer, error) {

	customers, err := s.repo.ListCustomers(ctx)
	if err != nil {
		return nil, err
	}

	return customers, nil
}

// GetCustomerByUserID returns the customer profile owned by the identity user.
func (s *CustomerService) GetCustomerByUserID(
	ctx context.Context,
	userID int64,
) (sqlc.Customer, error) {
	customer, err := s.repo.GetCustomerByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return sqlc.Customer{}, customerauth.ErrNoLinkedCustomer
		}
		return sqlc.Customer{}, err
	}

	return customer, nil
}

// GetMyCustomerProfile returns the authenticated customer's profile and balance.
// Missing profiles are auto-provisioned for customer-role identity users.
func (s *CustomerService) GetMyCustomerProfile(
	ctx context.Context,
	userID int64,
	email string,
) (CustomerProfile, error) {
	customer, err := s.repo.GetCustomerByUserID(ctx, userID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return CustomerProfile{}, err
		}

		customer, err = s.EnsureCustomerProfile(ctx, userID, email)
		if err != nil {
			return CustomerProfile{}, err
		}
	}

	customerBalance, err := s.repo.GetCustomerBalance(ctx, customer.ID)
	if err != nil {
		return CustomerProfile{}, err
	}

	return CustomerProfile{
		Customer:        customer,
		OutstandingDue:  customerBalance.OutstandingDue,
		AvailableCredit: customerBalance.AvailableCredit,
	}, nil
}

// EnsureCustomerProfile creates a PayLater customer profile for an identity user
// when one does not already exist.
func (s *CustomerService) EnsureCustomerProfile(
	ctx context.Context,
	userID int64,
	email string,
) (sqlc.Customer, error) {
	email = strings.TrimSpace(email)
	if email == "" {
		identityEmail, err := s.repo.LookupIdentityUserByID(ctx, userID)
		if err != nil {
			return sqlc.Customer{}, err
		}
		email = identityEmail
	}

	params := sqlc.CreateCustomerParams{
		UserID:      sql.NullInt64{Int64: userID, Valid: true},
		Name:        customerNameFromEmail(email),
		Email:       email,
		CreditLimit: s.defaultCreditLimit,
	}

	if err := s.CreateCustomer(ctx, params); err != nil {
		return sqlc.Customer{}, err
	}

	return s.repo.GetCustomerByUserID(ctx, userID)
}

func customerNameFromEmail(email string) string {
	localPart := strings.Split(email, "@")[0]
	localPart = strings.NewReplacer(".", " ", "_", " ", "-", " ").Replace(localPart)
	localPart = strings.Join(strings.Fields(localPart), " ")

	if localPart == "" {
		return "Customer"
	}

	return localPart
}
