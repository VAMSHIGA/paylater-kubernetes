package repository

import (
	"context"
	"database/sql"
	"fmt"

	"paylater/shared/balance"
	"paylater/shared/creditlimit"
	platformerrors "paylater/shared/errors"
	"paylater/transaction-service/db/sqlc"
)

// CreateTransaction inserts a transaction and optionally enforces credit limits
// for customer-role callers.
func (r *Repository) CreateTransaction(
	ctx context.Context,
	params sqlc.CreateTransactionParams,
	enforceCreditLimit bool,
) error {
	if !enforceCreditLimit {
		_, err := r.queries.CreateTransaction(ctx, params)
		return err
	}

	conn, err := r.db.Conn(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()

	lockName := creditlimit.CustomerBalanceLockName(params.CustomerID)

	var lockStatus sql.NullInt64
	if err := conn.QueryRowContext(ctx, "SELECT GET_LOCK(?, 10)", lockName).Scan(&lockStatus); err != nil {
		return fmt.Errorf("acquire credit lock: %w", err)
	}
	if !lockStatus.Valid || lockStatus.Int64 != 1 {
		return fmt.Errorf("acquire credit lock: unavailable")
	}
	defer conn.ExecContext(ctx, "SELECT RELEASE_LOCK(?)", lockName)

	allowed, err := balance.TransactionWithinCreditLimit(
		ctx,
		conn,
		r.balanceDatabaseNames(),
		params.CustomerID,
		params.Amount,
	)
	if err != nil {
		return err
	}
	if !allowed {
		return platformerrors.ErrCreditLimitExceeded
	}

	queries := sqlc.New(conn)
	_, err = queries.CreateTransaction(ctx, params)
	return err
}

func (r *Repository) balanceDatabaseNames() balance.DatabaseNames {
	r.loadCustomerDBName()
	r.loadCrossDatabaseNames()

	return balance.DatabaseNames{
		CustomerDB:    r.customerDBName(),
		TransactionDB: r.transactionDBName(),
		PaybackDB:     r.paybackDBName(),
	}
}
