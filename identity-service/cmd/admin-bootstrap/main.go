// Command admin-bootstrap provisions an operator-controlled admin account in identity_db.
//
// This is not exposed over HTTP. Public POST /auth/register with role=admin
// remains forbidden.
package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"os"
	"strings"

	"paylater/identity-service/internal/bootstrap"
	"paylater/identity-service/internal/repository"
	"paylater/shared/config"
	"paylater/shared/database"
)

func main() {
	defaultEmail := os.Getenv("ADMIN_BOOTSTRAP_EMAIL")
	defaultPassword := os.Getenv("ADMIN_BOOTSTRAP_PASSWORD")

	email := flag.String("email", defaultEmail, "admin email address")
	password := flag.String("password", defaultPassword, "admin password")
	flag.Parse()

	if strings.TrimSpace(*email) == "" || *password == "" {
		log.Fatal("email and password are required (use --email/--password or ADMIN_BOOTSTRAP_EMAIL/ADMIN_BOOTSTRAP_PASSWORD)")
	}

	cfg, err := config.Load("8081")
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	conn, err := database.Connect(cfg.DB)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer conn.Close()

	repo := repository.New(conn)
	err = bootstrap.CreateAdmin(context.Background(), repo, *email, *password)
	if err != nil {
		switch {
		case errors.Is(err, bootstrap.ErrAdminUserAlreadyExists):
			log.Fatal(err.Error())
		case errors.Is(err, bootstrap.ErrInvalidEmail):
			log.Fatal(err.Error())
		case errors.Is(err, bootstrap.ErrInvalidPassword):
			log.Fatal(err.Error())
		default:
			log.Fatalf("bootstrap failed: %v", err)
		}
	}

	log.Print(bootstrap.SuccessMessage(strings.TrimSpace(*email)))
}
