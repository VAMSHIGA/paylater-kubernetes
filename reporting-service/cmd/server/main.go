// Command server is the Reporting Service process entry point.
//
// Startup flow:
//  1. Load configuration (port 8086, report_db, JWT secret).
//  2. Connect to MySQL.
//  3. Refresh report_db snapshot from domain databases.
//  4. Wire repository → service → handler → router.
//  5. Listen for HTTP requests on the configured port.
package main

import (
	"context"
	"log"

	"github.com/gin-gonic/gin"

	"paylater/reporting-service/internal/handler"
	"paylater/reporting-service/internal/repository"
	"paylater/reporting-service/internal/router"
	"paylater/reporting-service/internal/service"
	"paylater/reporting-service/internal/sync"
	"paylater/shared/config"
	"paylater/shared/database"
)

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

	// Populate report_db before serving traffic so the first report request has data.
	if err := sync.RefreshSnapshot(context.Background(), conn, sync.SourceDBsFromEnv()); err != nil {
		log.Fatalf("initial report snapshot refresh failed: %v", err)
	}

	repo := repository.New(conn)
	reportService := service.NewReportService(repo, conn)
	reportHandler := handler.NewReportHandler(reportService)

	engine := gin.Default()
	router.ReportRoutes(engine, reportHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Reporting Service started on %s", addr)

	if err := engine.Run(addr); err != nil {
		log.Fatal(err)
	}
}
