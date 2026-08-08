// Command server is the Merchant Service process entry point.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/merchant-service/internal/handler"
	"paylater/merchant-service/internal/repository"
	"paylater/merchant-service/internal/router"
	"paylater/merchant-service/internal/service"
	"paylater/shared/config"
	"paylater/shared/database"
	"paylater/shared/health"
	"paylater/shared/server"
)

func main() {
	cfg, err := config.Load("8083")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	repo := repository.New(conn)
	merchantService := service.NewMerchantService(repo)
	merchantHandler := handler.NewMerchantHandler(merchantService)

	engine := gin.Default()
	health.Register(engine)
	router.RegisterMerchantRoutes(engine, merchantHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Merchant Service started on %s", addr)

	if err := server.Run(engine, addr); err != nil {
		log.Fatal(err)
	}
}
