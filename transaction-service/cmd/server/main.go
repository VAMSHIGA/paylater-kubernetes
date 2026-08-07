// Command server is the Transaction Service process entry point.
//
// Startup flow:
//  1. Load configuration (port 8084, transaction_db, JWT secret).
//  2. Connect to MySQL.
//  3. Wire repository → service → handler → router.
//  4. Listen for HTTP requests on the configured port.
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/shared/config"
	"paylater/shared/database"
	"paylater/transaction-service/internal/handler"
	"paylater/transaction-service/internal/repository"
	"paylater/transaction-service/internal/router"
	"paylater/transaction-service/internal/service"
)

func main() {
	cfg, err := config.Load("8084")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	repo := repository.New(conn)
	transactionService := service.NewTransactionService(repo)
	transactionHandler := handler.NewTransactionHandler(transactionService)

	engine := gin.Default()
	router.TransactionRoutes(engine, transactionHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Transaction Service started on %s", addr)

	if err := engine.Run(addr); err != nil {
		log.Fatal(err)
	}
}
