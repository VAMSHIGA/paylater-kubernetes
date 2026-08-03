// Command server is the Identity Service process entry point.
//
// It loads shared config (default port 8081), connects to identity_db, wires
// repository → service → handler → router, and serves authentication APIs.
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

	router.AuthRoutes(engine, authHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Identity Service started on %s", addr)

	if err := engine.Run(addr); err != nil {
		log.Fatal(err)
	}
}
