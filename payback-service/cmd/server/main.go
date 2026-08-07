// Command server is the Payback Service process entry point.
//
// Startup flow:
//  1. Load configuration (port 8085, payback_db, JWT secret).
//  2. Connect to MySQL.
//  3. Wire repository → service → handler → router.
//  4. Listen for HTTP requests on the configured port.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/payback-service/internal/handler"
	"paylater/payback-service/internal/repository"
	"paylater/payback-service/internal/router"
	"paylater/payback-service/internal/service"
	"paylater/shared/config"
	"paylater/shared/database"
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
	paybackHandler := handler.NewPaybackHandler(paybackService)

	engine := gin.Default()
	router.PaybackRoutes(engine, paybackHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Payback Service started on %s", addr)

	if err := engine.Run(addr); err != nil {
		log.Fatal(err)
	}
}
