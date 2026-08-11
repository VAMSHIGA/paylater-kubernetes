// Command server is the Payback Service process entry point.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/payback-service/internal/handler"
	"paylater/payback-service/internal/repository"
	"paylater/payback-service/internal/router"
	"paylater/payback-service/internal/service"
	"paylater/shared/config"
	"paylater/shared/customerauth"
	"paylater/shared/database"
	"paylater/shared/health"
	"paylater/shared/server"
)

func main() {
	cfg, err := config.Load("8085")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	repo := repository.New(conn)
	paybackService := service.NewPaybackService(repo)
	ownershipResolver := customerauth.NewDBResolver(conn)
	paybackHandler := handler.NewPaybackHandler(paybackService, ownershipResolver)

	engine := gin.Default()
	health.Register(engine)
	router.PaybackRoutes(engine, paybackHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Payback Service started on %s", addr)

	if err := server.Run(engine, addr); err != nil {
		log.Fatal(err)
	}
}
