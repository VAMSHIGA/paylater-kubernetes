package config

import "os"

const (
	EnvDefaultMerchantCommission = "DEFAULT_MERCHANT_COMMISSION"
	defaultMerchantCommission    = "5.00"
)

func LoadDefaultMerchantCommission() string {
	if value := os.Getenv(EnvDefaultMerchantCommission); value != "" {
		return value
	}

	return defaultMerchantCommission
}
