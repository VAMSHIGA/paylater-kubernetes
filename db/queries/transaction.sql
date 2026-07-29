-- ===========================
-- Transaction Queries
-- ===========================
-- Contains SQL queries related to PayLater transactions.


-- ===========================
-- Create Transaction
-- ===========================
-- Creates a new PayLater transaction when a customer
-- purchases something from a merchant.
--
-- Stores:
-- customer_id      -> Customer making the purchase
-- merchant_id      -> Merchant where purchase happened
-- amount           -> Purchase amount
-- commission       -> Merchant commission for transaction
-- transaction_date -> Date of purchase
--
-- SQLC generates:
-- CreateTransaction(ctx, params)

-- name: CreateTransaction :execresult
INSERT INTO transactions (
    customer_id,
    merchant_id,
    amount,
    commission,
    transaction_date
)
VALUES (?, ?, ?, ?, ?);