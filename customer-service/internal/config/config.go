package config

import (
	"os"
)

const (
	EnvDefaultCustomerCreditLimit = "DEFAULT_CUSTOMER_CREDIT_LIMIT"
	defaultCustomerCreditLimit    = "1000.00"
)

// LoadDefaultCustomerCreditLimit returns the configured default PayLater credit limit
// for auto-provisioned customer profiles.
func LoadDefaultCustomerCreditLimit() string {
	if value := os.Getenv(EnvDefaultCustomerCreditLimit); value != "" {
		return value
	}

	return defaultCustomerCreditLimit
}
