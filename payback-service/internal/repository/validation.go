package repository

import (
	"context"
	"fmt"
	"os"
)

const (
	envCustomerDB     = "CUSTOMER_DB"
	envTransactionDB  = "TRANSACTION_DB"
	envPaybackDB      = "PAYBACK_DB"
	defaultCustomerDB = "customer_db"
)

func (r *Repository) customerDBName() string {
	if r.customerDB != "" {
		return r.customerDB
	}
	return defaultCustomerDB
}

func (r *Repository) loadCustomerDBName() {
	if r.customerDB == "" {
		if value := os.Getenv(envCustomerDB); value != "" {
			r.customerDB = value
		} else {
			r.customerDB = defaultCustomerDB
		}
	}
}

func (r *Repository) transactionDBName() string {
	if r.transactionDB != "" {
		return r.transactionDB
	}
	return "transaction_db"
}

func (r *Repository) paybackDBName() string {
	if r.paybackDB != "" {
		return r.paybackDB
	}
	return "payback_db"
}

func (r *Repository) loadCrossDatabaseNames() {
	if r.transactionDB == "" {
		if value := os.Getenv(envTransactionDB); value != "" {
			r.transactionDB = value
		} else {
			r.transactionDB = "transaction_db"
		}
	}
	if r.paybackDB == "" {
		if value := os.Getenv(envPaybackDB); value != "" {
			r.paybackDB = value
		} else {
			r.paybackDB = "payback_db"
		}
	}
}

// CustomerExists checks whether a customer row exists in customer_db.
func (r *Repository) CustomerExists(ctx context.Context, customerID int64) (bool, error) {
	r.loadCustomerDBName()

	query := fmt.Sprintf("SELECT COUNT(*) FROM %s.customers WHERE id = ?", r.customerDBName())
	var count int64
	if err := r.db.QueryRowContext(ctx, query, customerID).Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}
