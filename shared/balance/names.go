package balance

import (
	"os"
)

const (
	EnvCustomerDB        = "CUSTOMER_DB"
	EnvTransactionDB     = "TRANSACTION_DB"
	EnvPaybackDB         = "PAYBACK_DB"
	DefaultCustomerDB    = "customer_db"
	DefaultTransactionDB = "transaction_db"
	DefaultPaybackDB     = "payback_db"
)

// DatabaseNames identifies the logical MySQL databases used in balance queries.
type DatabaseNames struct {
	CustomerDB    string
	TransactionDB string
	PaybackDB     string
}

// LoadDatabaseNames reads cross-database names from the environment.
func LoadDatabaseNames() DatabaseNames {
	customerDB := DefaultCustomerDB
	if value := os.Getenv(EnvCustomerDB); value != "" {
		customerDB = value
	}

	transactionDB := DefaultTransactionDB
	if value := os.Getenv(EnvTransactionDB); value != "" {
		transactionDB = value
	}

	paybackDB := DefaultPaybackDB
	if value := os.Getenv(EnvPaybackDB); value != "" {
		paybackDB = value
	}

	return DatabaseNames{
		CustomerDB:    customerDB,
		TransactionDB: transactionDB,
		PaybackDB:     paybackDB,
	}
}
