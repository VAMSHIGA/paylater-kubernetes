-- name: CreateMerchant :execresult
INSERT INTO merchants (
    merchant_name,
    phone_number,
    onboarding,
    commission
) VALUES (?, ?, ?, ?);

-- name: GetMerchant :one
SELECT *
FROM merchants
WHERE id = ?;

-- name: ListMerchants :many
SELECT *
FROM merchants;

-- name: UpdateMerchant :exec
UPDATE merchants
SET
    merchant_name = ?,
    phone_number = ?,
    onboarding = ?,
    commission = ?
WHERE id = ?;

-- name: DeleteMerchant :exec
DELETE FROM merchants
WHERE id = ?;