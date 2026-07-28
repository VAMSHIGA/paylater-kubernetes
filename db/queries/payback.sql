-- name: CreatePayback :execresult
INSERT INTO paybacks (
    customer_id,
    amount,
    payment_date
) VALUES (?, ?, ?);

-- name: GetPayback :one
SELECT *
FROM paybacks
WHERE id = ?;

-- name: ListPaybacks :many
SELECT *
FROM paybacks;

-- name: DeletePayback :exec
DELETE FROM paybacks
WHERE id = ?;