package repository

import (
	"context"
	"fmt"
)

const (
	defaultCustomerDB = "customer_db"
	defaultMerchantDB = "merchant_db"
)

func (r *Repository) customerDBName() string {
	if r.customerDB != "" {
		return r.customerDB
	}
	return defaultCustomerDB
}

func (r *Repository) merchantDBName() string {
	if r.merchantDB != "" {
		return r.merchantDB
	}
	return defaultMerchantDB
}

// CustomerExists checks whether a customer row exists in customer_db.
func (r *Repository) CustomerExists(ctx context.Context, customerID int64) (bool, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.customers WHERE id = ?", r.customerDBName())
	var count int64
	if err := r.db.QueryRowContext(ctx, query, customerID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

// MerchantExists checks whether a merchant row exists in merchant_db.
func (r *Repository) MerchantExists(ctx context.Context, merchantID int64) (bool, error) {
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.merchants WHERE id = ?", r.merchantDBName())
	var count int64
	if err := r.db.QueryRowContext(ctx, query, merchantID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}
