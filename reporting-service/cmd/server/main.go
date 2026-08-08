// Command server is the Reporting Service process entry point.
package main

import (
	"context"
	"log"
	"time"

	"github.com/gin-gonic/gin"

	"paylater/reporting-service/internal/handler"
	"paylater/reporting-service/internal/repository"
	"paylater/reporting-service/internal/router"
	"paylater/reporting-service/internal/service"
	"paylater/reporting-service/internal/sync"
	"paylater/shared/config"
	"paylater/shared/database"
	"paylater/shared/health"
	"paylater/shared/server"
)

const snapshotRefreshInterval = 60 * time.Second

func main() {
	cfg, err := config.Load("8086")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	sources := sync.SourceDBsFromEnv()
	if err := sync.RefreshSnapshot(context.Background(), conn, sources); err != nil {
		log.Fatalf("initial report snapshot refresh failed: %v", err)
	}

	go func() {
		ticker := time.NewTicker(snapshotRefreshInterval)
		defer ticker.Stop()

		for range ticker.C {
			if err := sync.RefreshSnapshot(context.Background(), conn, sources); err != nil {
				log.Printf("scheduled report snapshot refresh failed: %v", err)
			}
		}
	}()

	repo := repository.New(conn)
	reportService := service.NewReportService(repo)
	reportHandler := handler.NewReportHandler(reportService)

	engine := gin.Default()
	health.Register(engine)
	router.ReportRoutes(engine, reportHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Reporting Service started on %s", addr)

	if err := server.Run(engine, addr); err != nil {
		log.Fatal(err)
	}
}
