-- ===========================
-- Paybacks Table
-- ===========================
-- Stores customer repayment information.
-- A payback happens when a customer repays
-- an amount they owe in the PayLater system.

CREATE TABLE paybacks (

    -- Unique identifier for each payback.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Customer who is making the repayment.
    customer_id BIGINT NOT NULL,

    -- Amount being repaid by the customer.
    amount DECIMAL(10,2) NOT NULL,

    -- Date when the repayment was made.
    payment_date DATE NOT NULL
);

-- customer_id is a logical reference only.
-- Foreign keys to customers are not enforced in payback_db
-- because the customers table is owned by Customer Service (customer_db).
