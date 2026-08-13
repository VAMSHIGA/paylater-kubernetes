-- ===========================
-- Payback Queries
-- ===========================
-- Contains SQL queries related to
-- customer repayments in the PayLater system.


-- ===========================
-- Create Payback
-- ===========================
-- Creates a repayment record when a customer
-- pays back an amount they owe.
--
-- customer_id  -> Customer making the repayment
-- amount       -> Amount customer is paying back
-- payment_date -> Date when repayment happened
--
-- SQLC generates:
-- CreatePayback(ctx, params)

-- name: CreatePayback :execresult
INSERT INTO paybacks (
    customer_id,
    amount,
    payment_date
)
VALUES (?, ?, ?);


-- ===========================
-- List Paybacks
-- ===========================
-- Returns all paybacks ordered by newest first.

-- name: ListPaybacks :many
SELECT
    id,
    customer_id,
    amount,
    payment_date
FROM paybacks
ORDER BY id DESC;


-- ===========================
-- List Paybacks By Customer ID
-- ===========================
-- Returns paybacks for a single customer ordered by newest first.

-- name: ListPaybacksByCustomerID :many
SELECT
    id,
    customer_id,
    amount,
    payment_date
FROM paybacks
WHERE customer_id = ?
ORDER BY id DESC;
