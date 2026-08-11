// Package creditlimit documents PayLater outstanding-credit calculations.
//
// Reporting, transaction authorization, and payback authorization all use the
// formulas implemented in paylater/shared/balance:
//
//	remaining_due = SUM(transactions.amount) - SUM(paybacks.amount)
//	available_credit = credit_limit - remaining_due
//
// A customer-role transaction is allowed when:
//
//	remaining_due + transaction_amount <= credit_limit
//
// A customer-role payback is allowed when:
//
//	payback_amount <= remaining_due
package creditlimit

import "fmt"

// CustomerBalanceLockName returns the MySQL advisory lock name used to serialize
// per-customer balance mutations across transaction and payback services.
func CustomerBalanceLockName(customerID int64) string {
	return fmt.Sprintf("paylater_credit_%d", customerID)
}
