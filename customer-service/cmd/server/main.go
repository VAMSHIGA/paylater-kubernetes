// Command server is the Customer Service process entry point.
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
	"paylater/shared/health"
	"paylater/shared/server"
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
	health.Register(engine)
	router.CustomerRoutes(engine, customerHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Customer Service started on %s", addr)

	if err := server.Run(engine, addr); err != nil {
		log.Fatal(err)
	}
}
