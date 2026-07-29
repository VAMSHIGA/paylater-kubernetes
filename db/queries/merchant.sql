-- ===========================
-- Merchant Queries
-- ===========================


-- ===========================
-- Create Merchant
-- ===========================
-- Creates/onboards a new merchant.
--
-- SQLC generates:
-- CreateMerchant(ctx, params)

-- name: CreateMerchant :execresult
INSERT INTO merchants (
    merchant_name,
    phone_number,
    onboarding,
    commission
)
VALUES (?, ?, ?, ?);


-- ===========================
-- Update Merchant Commission
-- ===========================
-- Updates only the commission percentage
-- for an existing merchant.
--
-- Merchant is identified using its ID.
--
-- SQLC generates:
-- UpdateMerchantCommission(ctx, params)

-- name: UpdateMerchantCommission :exec
UPDATE merchants
SET commission = ?
WHERE id = ?;