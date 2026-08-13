// Package merchantauth enforces merchant-profile ownership for merchant-role JWTs.
package merchantauth

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
	envMerchantDB     = "MERCHANT_DB"
	defaultMerchantDB = "merchant_db"
)

var (
	ErrNoLinkedMerchant = errors.New("no merchant profile linked to your account")
)

type Resolver interface {
	GetMerchantIDByUserID(ctx context.Context, userID int64) (int64, error)
}

type DBResolver struct {
	db         *sql.DB
	merchantDB string
}

func NewDBResolver(db *sql.DB) *DBResolver {
	merchantDB := os.Getenv(envMerchantDB)
	if merchantDB == "" {
		merchantDB = defaultMerchantDB
	}

	return &DBResolver{db: db, merchantDB: merchantDB}
}

func (r *DBResolver) GetMerchantIDByUserID(ctx context.Context, userID int64) (int64, error) {
	query := fmt.Sprintf(
		"SELECT id FROM %s.merchants WHERE user_id = ? LIMIT 1",
		r.merchantDB,
	)

	var merchantID int64
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&merchantID)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNoLinkedMerchant
	}
	if err != nil {
		return 0, err
	}

	return merchantID, nil
}

func EnforceMerchantAccess(
	ctx context.Context,
	role string,
	userID int64,
	requestedMerchantID int64,
	resolver Resolver,
) error {
	if role != constants.RoleMerchant {
		return nil
	}

	ownedMerchantID, err := resolver.GetMerchantIDByUserID(ctx, userID)
	if err != nil {
		return err
	}

	if ownedMerchantID != requestedMerchantID {
		return platformerrors.ErrNotAuthorized
	}

	return nil
}
