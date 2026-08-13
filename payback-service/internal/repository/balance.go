package repository

import (
	"context"
	"database/sql"
	"fmt"

	"paylater/payback-service/db/sqlc"
	"paylater/shared/balance"
	"paylater/shared/creditlimit"
)

// CreatePayback inserts a payback and enforces remaining-due validation for all callers.
func (r *Repository) CreatePayback(
	ctx context.Context,
	params sqlc.CreatePaybackParams,
	enforceBalanceValidation bool,
) error {
	if !enforceBalanceValidation {
		_, err := r.queries.CreatePayback(ctx, params)
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
		return fmt.Errorf("acquire balance lock: %w", err)
	}
	if !lockStatus.Valid || lockStatus.Int64 != 1 {
		return fmt.Errorf("acquire balance lock: unavailable")
	}
	defer conn.ExecContext(ctx, "SELECT RELEASE_LOCK(?)", lockName)

	if err := balance.ValidatePaybackAmount(
		ctx,
		conn,
		r.balanceDatabaseNames(),
		params.CustomerID,
		params.Amount,
	); err != nil {
		return err
	}

	queries := sqlc.New(conn)
	_, err = queries.CreatePayback(ctx, params)
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
