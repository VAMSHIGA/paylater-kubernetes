// Package utils contains small helpers shared across PayLater services.
//
// ValueToString exists because MySQL DECIMAL/CHAR aggregates often scan as
// []byte; encoding those values as JSON without conversion produces Base64.
// Reporting Service uses this helper when shaping dues and fee responses.
package utils

import "fmt"

// ValueToString converts MySQL DECIMAL/CHAR scan values to readable strings.
//
// nil becomes "0.00"; []byte is decoded as UTF-8 text; other values use fmt.Sprint.
func ValueToString(value interface{}) string {
	if value == nil {
		return "0.00"
	}

	if bytes, ok := value.([]byte); ok {
		return string(bytes)
	}

	return fmt.Sprint(value)
}
