package service

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"paylater/customer-service/db/sqlc"
	"paylater/shared/balance"
	"paylater/shared/customerauth"
)

type customerRepoStub struct {
	lookupUserID           sql.NullInt64
	lookupErr              error
	lookupIdentityEmail    string
	lookupIdentityEmailErr error
	createParams           sqlc.CreateCustomerParams
	createCalled           bool
	getCustomerByUserID    sqlc.Customer
	getCustomerByUserIDErr error
	getCustomerByUserCalls int
	getCustomerBalance     balance.CustomerBalanceResult
	getCustomerBalanceErr  error
}

func (s *customerRepoStub) LookupCustomerUserIDByEmail(
	_ context.Context,
	_ string,
) (sql.NullInt64, error) {
	return s.lookupUserID, s.lookupErr
}

func (s *customerRepoStub) LookupIdentityUserByID(
	_ context.Context,
	_ int64,
) (string, error) {
	if s.lookupIdentityEmailErr != nil {
		return "", s.lookupIdentityEmailErr
	}
	return s.lookupIdentityEmail, nil
}

func (s *customerRepoStub) CreateCustomer(
	_ context.Context,
	params sqlc.CreateCustomerParams,
) (sql.Result, error) {
	s.createCalled = true
	s.createParams = params
	return stubResult{}, nil
}

func (s *customerRepoStub) ListCustomers(_ context.Context) ([]sqlc.Customer, error) {
	return nil, nil
}

func (s *customerRepoStub) GetCustomerByUserID(
	_ context.Context,
	_ int64,
) (sqlc.Customer, error) {
	s.getCustomerByUserCalls++
	if s.getCustomerByUserCalls == 1 && s.getCustomerByUserIDErr != nil {
		return sqlc.Customer{}, s.getCustomerByUserIDErr
	}
	if s.getCustomerByUserID.ID == 0 {
		return sqlc.Customer{}, sql.ErrNoRows
	}
	return s.getCustomerByUserID, nil
}

func (s *customerRepoStub) GetCustomerBalance(
	_ context.Context,
	_ int64,
) (balance.CustomerBalanceResult, error) {
	if s.getCustomerBalanceErr != nil {
		return balance.CustomerBalanceResult{}, s.getCustomerBalanceErr
	}
	return s.getCustomerBalance, nil
}

type stubResult struct{}

func (stubResult) LastInsertId() (int64, error) { return 1, nil }
func (stubResult) RowsAffected() (int64, error) { return 1, nil }

func TestCreateCustomer_AutoLinksIdentityUserIDByEmail(t *testing.T) {
	repo := &customerRepoStub{
		lookupUserID: sql.NullInt64{Int64: 1, Valid: true},
	}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	err := svc.CreateCustomer(context.Background(), sqlc.CreateCustomerParams{
		Name:        "Vamshi Test Customer",
		Email:       "vamshi.customer@test.com",
		CreditLimit: "10000",
	})
	if err != nil {
		t.Fatalf("CreateCustomer returned error: %v", err)
	}
	if !repo.createCalled {
		t.Fatal("expected CreateCustomer to persist the customer")
	}
	if !repo.createParams.UserID.Valid || repo.createParams.UserID.Int64 != 1 {
		t.Fatalf("user_id = %+v, want Valid Int64=1", repo.createParams.UserID)
	}
}

func TestCreateCustomer_RejectsMissingIdentityUser(t *testing.T) {
	repo := &customerRepoStub{}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	err := svc.CreateCustomer(context.Background(), sqlc.CreateCustomerParams{
		Name:        "Orphan",
		Email:       "missing@test.com",
		CreditLimit: "1000",
	})
	if !errors.Is(err, ErrIdentityCustomerNotFound) {
		t.Fatalf("error = %v, want ErrIdentityCustomerNotFound", err)
	}
	if repo.createCalled {
		t.Fatal("CreateCustomer must not insert when identity user is missing")
	}
}

func TestCreateCustomer_PreservesExplicitUserID(t *testing.T) {
	repo := &customerRepoStub{
		lookupUserID: sql.NullInt64{Int64: 99, Valid: true},
	}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	err := svc.CreateCustomer(context.Background(), sqlc.CreateCustomerParams{
		UserID:      sql.NullInt64{Int64: 7, Valid: true},
		Name:        "Explicit",
		Email:       "explicit@test.com",
		CreditLimit: "500",
	})
	if err != nil {
		t.Fatalf("CreateCustomer returned error: %v", err)
	}
	if repo.createParams.UserID.Int64 != 7 {
		t.Fatalf("user_id = %d, want 7", repo.createParams.UserID.Int64)
	}
}

func TestGetCustomerByUserID_ReturnsProfile(t *testing.T) {
	repo := &customerRepoStub{
		getCustomerByUserID: sqlc.Customer{
			ID:          8,
			UserID:      sql.NullInt64{Int64: 18, Valid: true},
			Name:        "Galinki",
			Email:       "galinkivamshi420@gmail.com",
			CreditLimit: "10000.00",
		},
	}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	customer, err := svc.GetCustomerByUserID(context.Background(), 18)
	if err != nil {
		t.Fatalf("GetCustomerByUserID returned error: %v", err)
	}
	if customer.ID != 8 || customer.CreditLimit != "10000.00" {
		t.Fatalf("customer = %+v, want id=8 credit_limit=10000.00", customer)
	}
}

func TestGetCustomerByUserID_ReturnsNotLinkedWhenMissing(t *testing.T) {
	repo := &customerRepoStub{}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	_, err := svc.GetCustomerByUserID(context.Background(), 99)
	if !errors.Is(err, customerauth.ErrNoLinkedCustomer) {
		t.Fatalf("error = %v, want ErrNoLinkedCustomer", err)
	}
}

func TestGetMyCustomerProfile_AutoProvisionsMissingProfile(t *testing.T) {
	repo := &customerRepoStub{
		getCustomerBalance: balance.CustomerBalanceResult{
			OutstandingDue:  "0.00",
			AvailableCredit: "1000.00",
		},
	}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	repo.getCustomerByUserIDErr = sql.ErrNoRows
	repo.getCustomerByUserID = sqlc.Customer{
		ID:          8,
		UserID:      sql.NullInt64{Int64: 18, Valid: true},
		Name:        "galinkivamshi420",
		Email:       "galinkivamshi420@gmail.com",
		CreditLimit: "1000.00",
	}

	profile, err := svc.GetMyCustomerProfile(
		context.Background(),
		18,
		"galinkivamshi420@gmail.com",
	)
	if err != nil {
		t.Fatalf("GetMyCustomerProfile returned error: %v", err)
	}
	if !repo.createCalled {
		t.Fatal("expected missing profile to be auto-provisioned")
	}
	if profile.Customer.ID != 8 {
		t.Fatalf("customer id = %d, want 8", profile.Customer.ID)
	}
	if profile.OutstandingDue != "0.00" || profile.AvailableCredit != "1000.00" {
		t.Fatalf("balance = %+v, want due=0.00 available=1000.00", profile)
	}
}

func TestEnsureCustomerProfile_UsesDefaultCreditLimit(t *testing.T) {
	repo := &customerRepoStub{
		getCustomerByUserID: sqlc.Customer{
			ID:          9,
			UserID:      sql.NullInt64{Int64: 18, Valid: true},
			Name:        "galinkivamshi420",
			Email:       "galinkivamshi420@gmail.com",
			CreditLimit: "1000.00",
		},
	}
	svc := &CustomerService{repo: repo, defaultCreditLimit: "1000.00"}

	customer, err := svc.EnsureCustomerProfile(
		context.Background(),
		18,
		"galinkivamshi420@gmail.com",
	)
	if err != nil {
		t.Fatalf("EnsureCustomerProfile returned error: %v", err)
	}
	if repo.createParams.CreditLimit != "1000.00" {
		t.Fatalf("credit_limit = %s, want 1000.00", repo.createParams.CreditLimit)
	}
	if customer.ID != 9 {
		t.Fatalf("customer id = %d, want 9", customer.ID)
	}
}

func TestCustomerNameFromEmail(t *testing.T) {
	if got := customerNameFromEmail("galinkivamshi420@gmail.com"); got != "galinkivamshi420" {
		t.Fatalf("name = %q, want galinkivamshi420", got)
	}
	if got := customerNameFromEmail("first.last@example.com"); got != "first last" {
		t.Fatalf("name = %q, want first last", got)
	}
}
