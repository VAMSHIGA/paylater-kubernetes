// Command server is the Transaction Service process entry point (default port 8084).
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
