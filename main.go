// Command paylater is the strangler-pattern API gateway for PayLater.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/config"
	"paylater/routes"
)

func main() {
	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

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

	addr := ":8080"
	log.Println("PayLater API started on :8080")

	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	errCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		log.Fatal(err)
	case sig := <-quit:
		log.Printf("shutdown signal received: %s", sig)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal(err)
	}

	log.Println("HTTP server stopped gracefully")
}
