// Package config resolves upstream microservice base URLs for the API gateway.
//
// Each helper reads a full URL env var first (for example IDENTITY_SERVICE_URL),
// then HOST+PORT pairs, then a localhost default matching the service port map
// (8081–8086). Used only by the monolith gateway in main.go; individual
// microservices load their own settings via paylater/shared/config.
package config

import (
	"os"
)

// IdentityServiceURL returns the base URL for the Identity Service.
// Used by the strangler proxy for POST /auth/register and POST /auth/login.
//
// Priority:
//   1. IDENTITY_SERVICE_URL (e.g. http://localhost:8081)
//   2. http://IDENTITY_SERVICE_HOST:IDENTITY_SERVICE_PORT
//   3. http://localhost:8081
func IdentityServiceURL() string {
	if url := os.Getenv("IDENTITY_SERVICE_URL"); url != "" {
		return url
	}

	host := os.Getenv("IDENTITY_SERVICE_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("IDENTITY_SERVICE_PORT")
	if port == "" {
		port = "8081"
	}

	return "http://" + host + ":" + port
}

// CustomerServiceURL returns the base URL for the Customer Service.
// Used by the strangler proxy for POST /customers and GET /customers.
//
// Priority:
//   1. CUSTOMER_SERVICE_URL (e.g. http://localhost:8082)
//   2. http://CUSTOMER_SERVICE_HOST:CUSTOMER_SERVICE_PORT
//   3. http://localhost:8082
func CustomerServiceURL() string {
	if url := os.Getenv("CUSTOMER_SERVICE_URL"); url != "" {
		return url
	}

	host := os.Getenv("CUSTOMER_SERVICE_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("CUSTOMER_SERVICE_PORT")
	if port == "" {
		port = "8082"
	}

	return "http://" + host + ":" + port
}

// MerchantServiceURL returns the base URL for the Merchant Service.
// Used by the strangler proxy for POST /merchants and PUT /merchants/:id.
//
// Priority:
//   1. MERCHANT_SERVICE_URL (e.g. http://localhost:8083)
//   2. http://MERCHANT_SERVICE_HOST:MERCHANT_SERVICE_PORT
//   3. http://localhost:8083
func MerchantServiceURL() string {
	if url := os.Getenv("MERCHANT_SERVICE_URL"); url != "" {
		return url
	}

	host := os.Getenv("MERCHANT_SERVICE_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("MERCHANT_SERVICE_PORT")
	if port == "" {
		port = "8083"
	}

	return "http://" + host + ":" + port
}

// TransactionServiceURL returns the base URL for the Transaction Service.
// Used by the strangler proxy for POST /transactions.
//
// Priority:
//   1. TRANSACTION_SERVICE_URL (e.g. http://localhost:8084)
//   2. http://TRANSACTION_SERVICE_HOST:TRANSACTION_SERVICE_PORT
//   3. http://localhost:8084
func TransactionServiceURL() string {
	if url := os.Getenv("TRANSACTION_SERVICE_URL"); url != "" {
		return url
	}

	host := os.Getenv("TRANSACTION_SERVICE_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("TRANSACTION_SERVICE_PORT")
	if port == "" {
		port = "8084"
	}

	return "http://" + host + ":" + port
}

// PaybackServiceURL returns the base URL for the Payback Service.
// Used by the strangler proxy for POST /paybacks.
//
// Priority:
//   1. PAYBACK_SERVICE_URL (e.g. http://localhost:8085)
//   2. http://PAYBACK_SERVICE_HOST:PAYBACK_SERVICE_PORT
//   3. http://localhost:8085
func PaybackServiceURL() string {
	if url := os.Getenv("PAYBACK_SERVICE_URL"); url != "" {
		return url
	}

	host := os.Getenv("PAYBACK_SERVICE_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("PAYBACK_SERVICE_PORT")
	if port == "" {
		port = "8085"
	}

	return "http://" + host + ":" + port
}

// ReportingServiceURL returns the base URL for the Reporting Service.
// Used by the strangler proxy for report GET endpoints.
//
// Priority:
//   1. REPORTING_SERVICE_URL (e.g. http://localhost:8086)
//   2. http://REPORTING_SERVICE_HOST:REPORTING_SERVICE_PORT
//   3. http://localhost:8086
func ReportingServiceURL() string {
	if url := os.Getenv("REPORTING_SERVICE_URL"); url != "" {
		return url
	}

	host := os.Getenv("REPORTING_SERVICE_HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("REPORTING_SERVICE_PORT")
	if port == "" {
		port = "8086"
	}

	return "http://" + host + ":" + port
}
