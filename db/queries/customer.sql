-- name: CreateCustomer :execresult
INSERT INTO customers (
    name,
    email,
    credit_limit,
    repay
) VALUES (?, ?, ?, ?);

-- name: GetCustomer :one
SELECT *
FROM customers
WHERE id = ?;

-- name: ListCustomers :many
SELECT *
FROM customers;

-- name: UpdateCustomer :exec
UPDATE customers
SET
    name = ?,
    email = ?,
    credit_limit = ?,
    repay = ?
WHERE id = ?;

-- name: DeleteCustomer :exec
DELETE FROM customers
WHERE id = ?;