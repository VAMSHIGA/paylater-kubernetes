-- Reporting Service read-model schema (report_db).
-- Snapshot copies of tables required by report.sql.
-- Live writes are owned by domain microservices; report_db is refreshed via migration scripts.

CREATE TABLE customers (

    -- Unique customer identifier.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Customer's full name.
    name VARCHAR(100) NOT NULL,

    -- Customer's email address.
    -- Must be unique for each customer.
    email VARCHAR(100) NOT NULL UNIQUE,

    -- Maximum credit limit assigned
    -- to the customer.
    credit_limit DECIMAL(10,2) NOT NULL
);




-- ===========================
-- Merchants Table
-- ===========================
-- Stores merchant information in the PayLater system.
-- A merchant is a business where customers can use
-- their PayLater credit.

CREATE TABLE merchants (

    -- Unique identifier for each merchant.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Name of the merchant/business.
    merchant_name VARCHAR(100) NOT NULL,

    -- Merchant's contact phone number.
    phone_number VARCHAR(20) NOT NULL,

    -- Date when the merchant joined/onboarded
    -- into the PayLater system.
    onboarding DATE NOT NULL,

    -- Commission percentage charged to the merchant.
    -- Example: 5.00 means 5%.
    commission DECIMAL(5,2) NOT NULL
);




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
    transaction_date DATE NOT NULL,

    -- Connect transaction to customers table.
    CONSTRAINT fk_transaction_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),

    -- Connect transaction to merchants table.
    CONSTRAINT fk_transaction_merchant
        FOREIGN KEY (merchant_id)
        REFERENCES merchants(id)
);




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
    payment_date DATE NOT NULL,

    -- Connect payback to the customers table.
    CONSTRAINT fk_payback_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);
