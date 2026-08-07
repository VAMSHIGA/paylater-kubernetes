// Command paylater is the strangler-pattern API gateway for PayLater.
//
// It listens on :8080 and reverse-proxies each public API path to the owning
// microservice. No local domain handlers or database connections remain here;
// JWT validation and business logic run inside the target services.
//
// Upstream bases come from config (IDENTITY_SERVICE_URL, CUSTOMER_SERVICE_URL,
// and the other *_SERVICE_URL variables). Clients keep a single entry point
// while services own their databases and routes.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/config"
	"paylater/routes"
)

func main() {
	router := gin.Default()

	// Register one reverse-proxy route group per downstream microservice.
	// Each group forwards requests to the service that owns that domain.
	identityServiceURL := config.IdentityServiceURL()
	log.Printf("Identity Service proxy target: %s", identityServiceURL)

	routes.AuthProxyRoutes(router, identityServiceURL)

	customerServiceURL := config.CustomerServiceURL()
	log.Printf("Customer Service proxy target: %s", customerServiceURL)

	routes.CustomerProxyRoutes(router, customerServiceURL)

	merchantServiceURL := config.MerchantServiceURL()
	log.Printf("Merchant Service proxy target: %s", merchantServiceURL)

	routes.MerchantProxyRoutes(router, merchantServiceURL)

	transactionServiceURL := config.TransactionServiceURL()
	log.Printf("Transaction Service proxy target: %s", transactionServiceURL)

	routes.TransactionProxyRoutes(router, transactionServiceURL)

	paybackServiceURL := config.PaybackServiceURL()
	log.Printf("Payback Service proxy target: %s", paybackServiceURL)

	routes.PaybackProxyRoutes(router, paybackServiceURL)

	reportingServiceURL := config.ReportingServiceURL()
	log.Printf("Reporting Service proxy target: %s", reportingServiceURL)

	routes.ReportProxyRoutes(router, reportingServiceURL)

	log.Println("🚀 PayLater API started on :8080")

	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
