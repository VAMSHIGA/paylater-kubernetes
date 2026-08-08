// Command server is the Identity Service process entry point.
//
// Startup flow:
//  1. Load configuration (port 8081, identity_db, JWT secret).
//  2. Connect to MySQL.
//  3. Wire repository → service → handler → router.
//  4. Listen for HTTP requests on the configured port.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/identity-service/internal/handler"
	"paylater/identity-service/internal/repository"
	"paylater/identity-service/internal/router"
	"paylater/identity-service/internal/service"
	"paylater/shared/config"
	"paylater/shared/database"
	"paylater/shared/health"
	"paylater/shared/server"
)

func main() {
	cfg, err := config.Load("8081")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	repo := repository.New(conn)
	authService := service.NewAuthService(repo)
	authHandler := handler.NewAuthHandler(authService)

	engine := gin.Default()
	health.Register(engine)
	router.AuthRoutes(engine, authHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Identity Service started on %s", addr)

	if err := server.Run(engine, addr); err != nil {
		log.Fatal(err)
	}
}
