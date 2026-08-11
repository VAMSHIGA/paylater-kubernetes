// Package customerauth enforces customer-profile ownership for customer-role JWTs.
//
// Identity users (users.id) link to customer profiles (customers.user_id).
// Customer-role callers may only act on their own customers.id in transaction
// and payback requests. Admin callers bypass ownership checks.
package customerauth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"

	"paylater/shared/constants"
	platformerrors "paylater/shared/errors"
)

const (
	envCustomerDB     = "CUSTOMER_DB"
	defaultCustomerDB = "customer_db"
)

var (
	// ErrNoLinkedCustomer means the authenticated user has no customer profile.
	ErrNoLinkedCustomer = errors.New("no customer profile linked to your account")
)

// Resolver looks up customer ownership for an identity user.
type Resolver interface {
	GetCustomerIDByUserID(ctx context.Context, userID int64) (int64, error)
}

// DBResolver resolves ownership via customer_db on the shared MySQL server.
type DBResolver struct {
	db         *sql.DB
	customerDB string
}

// NewDBResolver creates a resolver using CUSTOMER_DB or customer_db by default.
func NewDBResolver(db *sql.DB) *DBResolver {
	customerDB := os.Getenv(envCustomerDB)
	if customerDB == "" {
		customerDB = defaultCustomerDB
	}

	return &DBResolver{
		db:         db,
		customerDB: customerDB,
	}
}

// GetCustomerIDByUserID returns customers.id for the given identity users.id.
func (r *DBResolver) GetCustomerIDByUserID(ctx context.Context, userID int64) (int64, error) {
	query := fmt.Sprintf(
		"SELECT id FROM %s.customers WHERE user_id = ? LIMIT 1",
		r.customerDB,
	)

	var customerID int64
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&customerID)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNoLinkedCustomer
	}
	if err != nil {
		return 0, err
	}

	return customerID, nil
}

// EnforceCustomerAccess ensures a customer-role caller owns the requested customer_id.
//
// Admin and other roles bypass this check. Returns ErrNoLinkedCustomer or
// ErrNotAuthorized when access must be denied.
func EnforceCustomerAccess(
	ctx context.Context,
	role string,
	userID int64,
	requestedCustomerID int64,
	resolver Resolver,
) error {
	if role != constants.RoleCustomer {
		return nil
	}

	ownedCustomerID, err := resolver.GetCustomerIDByUserID(ctx, userID)
	if err != nil {
		return err
	}

	if ownedCustomerID != requestedCustomerID {
		return platformerrors.ErrNotAuthorized
	}

	return nil
}
