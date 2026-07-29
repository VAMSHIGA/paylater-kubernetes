package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {

	// Password we want to use for the first admin.
	password := "Admin@123"

	// Convert the plain password into a bcrypt hash.
	hash, err := bcrypt.GenerateFromPassword(
		[]byte(password),
		bcrypt.DefaultCost,
	)

	if err != nil {
		log.Fatal(err)
	}

	// Print the generated bcrypt hash.
	fmt.Println(string(hash))
}
