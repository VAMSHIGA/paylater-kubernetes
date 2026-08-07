// Package logger provides minimal structured logging helpers for shared code.
//
// Kept intentionally thin so services can later swap implementations without
// changing call sites in shared/database and similar packages.
package logger

import "log"

// Info logs an informational message (startup, connection success, etc.).
func Info(message string) {
	log.Println(message)
}

// Error logs an error message without terminating the process.
func Error(message string) {
	log.Println(message)
}
