-- name: CreateTransaction :execresult
INSERT INTO transactions (
    customer_id,
    merchant_id,
    amount,
    commission,
    transaction_date
) VALUES (?, ?, ?, ?, ?);

-- name: GetTransaction :one
SELECT *
FROM transactions
WHERE id = ?;

-- name: ListTransactions :many
SELECT *
FROM transactions;

-- name: UpdateTransaction :exec
UPDATE transactions
SET
    customer_id = ?,
    merchant_id = ?,
    amount = ?,
    commission = ?,
    transaction_date = ?
WHERE id = ?;

-- name: DeleteTransaction :exec
DELETE FROM transactions
WHERE id = ?;