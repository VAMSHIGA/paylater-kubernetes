-- =========================================
-- 1. Get Merchant Fees
-- =========================================
-- Purpose:
-- Shows each merchant name and commission.
--
-- Example:
-- Merchant A → Commission 250.00
--
-- name: GetMerchantFee :many
SELECT
    merchant_name,
    commission
FROM merchants;


-- =========================================
-- 2. Get Customer Dues
-- =========================================
-- Purpose:
-- Shows how much each customer:
-- 1. Spent through transactions
-- 2. Repaid through paybacks
-- 3. Still needs to repay
--
-- Formula:
-- Remaining Due = Total Transaction - Total Repaid
--
-- CAST(... AS CHAR) is used because SQLC was
-- generating int32 for decimal calculated values.
--
-- Example:
-- Transaction = 5000.00
-- Repaid      = 5000.00
-- Remaining   = 0.00
--
-- name: GetCustomerDues :many
SELECT
    c.id AS customer_id,
    c.name,

    -- Total amount spent by customer
    CAST(
        COALESCE(t.total_transaction, 0)
        AS CHAR
    ) AS total_transaction,

    -- Total amount repaid by customer
    CAST(
        COALESCE(p.total_repaid, 0)
        AS CHAR
    ) AS total_repaid,

    -- Amount customer still needs to repay
    CAST(
        COALESCE(t.total_transaction, 0)
        - COALESCE(p.total_repaid, 0)
        AS CHAR
    ) AS remaining_due

FROM customers c

-- Calculate total transactions for each customer
LEFT JOIN (
    SELECT
        customer_id,
        SUM(amount) AS total_transaction
    FROM transactions
    GROUP BY customer_id
) t
ON c.id = t.customer_id

-- Calculate total repayments for each customer
LEFT JOIN (
    SELECT
        customer_id,
        SUM(amount) AS total_repaid
    FROM paybacks
    GROUP BY customer_id
) p
ON c.id = p.customer_id;


-- =========================================
-- 3. Get Customers At Credit Limit
-- =========================================
-- Purpose:
-- Finds customers whose remaining due has
-- reached or exceeded their credit limit.
--
-- Example:
-- Credit Limit  = 5000.00
-- Remaining Due = 5000.00
-- Customer has reached the credit limit.
--
-- name: GetUsersAtCreditLimit :many
SELECT
    c.id AS customer_id,
    c.name,
    c.credit_limit,

    -- Convert calculated decimal value to string
    -- so SQLC can scan values such as 5000.00.
    CAST(
        COALESCE(t.total_transaction, 0)
        - COALESCE(p.total_repaid, 0)
        AS CHAR
    ) AS remaining_due

FROM customers c

-- Calculate total transactions for each customer
LEFT JOIN (
    SELECT
        customer_id,
        SUM(amount) AS total_transaction
    FROM transactions
    GROUP BY customer_id
) t
ON c.id = t.customer_id

-- Calculate total repayments for each customer
LEFT JOIN (
    SELECT
        customer_id,
        SUM(amount) AS total_repaid
    FROM paybacks
    GROUP BY customer_id
) p
ON c.id = p.customer_id

-- Return only customers who reached
-- or exceeded their credit limit
WHERE
    COALESCE(t.total_transaction, 0)
    - COALESCE(p.total_repaid, 0)
    >= c.credit_limit;


-- =========================================
-- 4. Get Total Dues
-- =========================================
-- Purpose:
-- Calculates the remaining amount owed
-- by all customers together.
--
-- Formula:
-- Total Dues = All Transactions - All Paybacks
--
-- CAST(... AS CHAR) prevents SQLC from
-- generating int32 for decimal money values.
--
-- name: GetTotalDues :one
SELECT
    CAST(
        COALESCE(
            (SELECT SUM(amount) FROM transactions),
            0
        )
        -
        COALESCE(
            (SELECT SUM(amount) FROM paybacks),
            0
        )
        AS CHAR
    ) AS total_dues;
