package balance

import (
	"context"
	"database/sql"
	"fmt"

	platformerrors "paylater/shared/errors"
)

// RowQuerier executes a single-row query. Both *sql.DB and *sql.Conn implement it.
type RowQuerier interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

// CustomerBalanceResult holds a customer's outstanding due and available credit.
type CustomerBalanceResult struct {
	OutstandingDue  string
	AvailableCredit string
}

// CustomerBalance returns remaining due and available credit for a customer
// using the shared PayLater formulas:
//
//	remaining_due = SUM(transactions) - SUM(paybacks)
//	available_credit = GREATEST(credit_limit - remaining_due, 0)
func CustomerBalance(
	ctx context.Context,
	querier RowQuerier,
	dbs DatabaseNames,
	customerID int64,
) (CustomerBalanceResult, error) {
	dueExpr := remainingDueExpression(dbs.TransactionDB, dbs.PaybackDB)
	query := fmt.Sprintf(`
		SELECT
			CAST(GREATEST(%s, 0) AS CHAR),
			CAST(GREATEST(c.credit_limit - GREATEST(%s, 0), 0) AS CHAR)
		FROM %s.customers c
		WHERE c.id = ?`,
		dueExpr,
		dueExpr,
		dbs.CustomerDB,
	)

	var balance CustomerBalanceResult
	err := querier.QueryRowContext(
		ctx,
		query,
		customerID,
		customerID,
		customerID,
		customerID,
		customerID,
	).Scan(&balance.OutstandingDue, &balance.AvailableCredit)
	if err != nil {
		return CustomerBalanceResult{}, err
	}

	return balance, nil
}

func remainingDueExpression(transactionDB, paybackDB string) string {
	return fmt.Sprintf(`
		COALESCE((
			SELECT SUM(amount) FROM %s.transactions WHERE customer_id = ?
		), 0)
		- COALESCE((
			SELECT SUM(amount) FROM %s.paybacks WHERE customer_id = ?
		), 0)`,
		transactionDB,
		paybackDB,
	)
}

// TransactionWithinCreditLimit reports whether adding amount keeps the customer
// within their credit limit:
//
//	remaining_due + amount <= credit_limit
func TransactionWithinCreditLimit(
	ctx context.Context,
	querier RowQuerier,
	dbs DatabaseNames,
	customerID int64,
	amount string,
) (bool, error) {
	query := fmt.Sprintf(`
		SELECT CASE WHEN
			%s + CAST(? AS DECIMAL(10,2)) <= c.credit_limit
		THEN 1 ELSE 0 END
		FROM %s.customers c
		WHERE c.id = ?`,
		remainingDueExpression(dbs.TransactionDB, dbs.PaybackDB),
		dbs.CustomerDB,
	)

	var allowed int
	err := querier.QueryRowContext(
		ctx,
		query,
		customerID,
		customerID,
		amount,
		customerID,
	).Scan(&allowed)
	if err != nil {
		return false, err
	}

	return allowed == 1, nil
}

// ValidatePaybackAmount ensures a payback amount is positive and does not exceed
// the customer's remaining due.
func ValidatePaybackAmount(
	ctx context.Context,
	querier RowQuerier,
	dbs DatabaseNames,
	customerID int64,
	amount string,
) error {
	query := fmt.Sprintf(`
		SELECT CASE
			WHEN CAST(? AS DECIMAL(10,2)) <= 0 THEN 0
			WHEN CAST(? AS DECIMAL(10,2)) <= (%s) THEN 1
			ELSE 2
		END`,
		remainingDueExpression(dbs.TransactionDB, dbs.PaybackDB),
	)

	var status int
	err := querier.QueryRowContext(
		ctx,
		query,
		amount,
		amount,
		customerID,
		customerID,
	).Scan(&status)
	if err != nil {
		return err
	}

	switch status {
	case 1:
		return nil
	case 0:
		return platformerrors.ErrInvalidPaybackAmount
	default:
		return platformerrors.ErrPaybackExceedsRemainingDue
	}
}
