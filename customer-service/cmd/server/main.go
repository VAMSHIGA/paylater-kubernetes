// Command server is the Customer Service process entry point.
//
// Loads shared config (default port 8082), connects to customer_db, and serves
// admin-protected customer APIs behind the monolith strangler proxy.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/customer-service/internal/handler"
	"paylater/customer-service/internal/repository"
	"paylater/customer-service/internal/router"
	"paylater/customer-service/internal/service"
	"paylater/shared/config"
	"paylater/shared/database"
)

func main() {
	cfg, err := config.Load("8082")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close()

	repo := repository.New(conn)
	customerService := service.NewCustomerService(repo)
	customerHandler := handler.NewCustomerHandler(customerService)

	engine := gin.Default()

	router.CustomerRoutes(engine, customerHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Customer Service started on %s", addr)

	if err := engine.Run(addr); err != nil {
		log.Fatal(err)
	}
}
