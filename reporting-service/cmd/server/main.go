// Command server is the Reporting Service process entry point (default port 8086).
package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"paylater/reporting-service/internal/handler"
	"paylater/reporting-service/internal/repository"
	"paylater/reporting-service/internal/router"
	"paylater/reporting-service/internal/service"
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

	repo := repository.New(conn)
	reportService := service.NewReportService(repo)
	reportHandler := handler.NewReportHandler(reportService)

	engine := gin.Default()

	router.ReportRoutes(engine, reportHandler)

	addr := ":" + cfg.Server.Port
	log.Printf("Reporting Service started on %s", addr)

	if err := engine.Run(addr); err != nil {
		log.Fatal(err)
	}
}
