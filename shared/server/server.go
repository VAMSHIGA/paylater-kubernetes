// Package server runs a Gin HTTP server with graceful shutdown on SIGINT/SIGTERM.
package server

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

const defaultShutdownTimeout = 10 * time.Second

// Run starts the HTTP server and shuts down gracefully on SIGINT or SIGTERM.
func Run(engine *gin.Engine, addr string) error {
	srv := &http.Server{
		Addr:    addr,
		Handler: engine,
	}

	errCh := make(chan error, 1)
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		return err
	case sig := <-quit:
		log.Printf("shutdown signal received: %s", sig)
	}

	ctx, cancel := context.WithTimeout(context.Background(), defaultShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		return err
	}

	log.Println("HTTP server stopped gracefully")
	return nil
}
