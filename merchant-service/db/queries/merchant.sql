-- ===========================
-- Merchant Queries
-- ===========================

-- name: CreateMerchant :execresult
INSERT INTO merchants (
    merchant_name,
    phone_number,
    onboarding,
    commission,
    user_id
)
VALUES (?, ?, ?, ?, ?);


-- name: UpdateMerchantCommission :execrows
UPDATE merchants
SET commission = ?
WHERE id = ?;


-- name: GetMerchantByUserID :one
SELECT
    id,
    merchant_name,
    phone_number,
    onboarding,
    commission,
    user_id
FROM merchants
WHERE user_id = ?
LIMIT 1;


-- name: GetMerchantByID :one
SELECT
    id,
    merchant_name,
    phone_number,
    onboarding,
    commission,
    user_id
FROM merchants
WHERE id = ?
LIMIT 1;
