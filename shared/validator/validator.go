// Package validator provides reusable request parsing helpers for PayLater APIs.
//
// Date fields such as transaction_date, payment_date, and onboarding use
// YYYY-MM-DD. Handlers keep field-specific error messages while delegating the
// parse layout to ParseDateYYYYMMDD.
package validator

import (
	"time"

	"paylater/shared/constants"
)

// ParseDateYYYYMMDD parses a date string in YYYY-MM-DD format.
//
// Returns the parsed time.Time or the error from time.Parse when the value
// does not match DateLayoutYYYYMMDD.
func ParseDateYYYYMMDD(value string) (time.Time, error) {
	return time.Parse(constants.DateLayoutYYYYMMDD, value)
}
