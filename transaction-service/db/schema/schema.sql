-- ===========================
-- Transactions Table
-- ===========================
-- Stores PayLater purchase transactions.
-- A transaction happens when a customer
-- purchases something from a merchant.

CREATE TABLE transactions (

    -- Unique identifier for each transaction.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Customer who made the purchase.
    customer_id BIGINT NOT NULL,

    -- Merchant where the purchase happened.
    merchant_id BIGINT NOT NULL,

    -- Total purchase amount.
    amount DECIMAL(10,2) NOT NULL,

    -- Commission amount/percentage associated
    -- with this transaction.
    commission DECIMAL(10,2) NOT NULL,

    -- Date when the transaction happened.
    transaction_date DATE NOT NULL
);

-- customer_id and merchant_id are logical references.
-- FK constraints are not defined here; customers and merchants
-- are owned by Customer and Merchant services in separate databases.

