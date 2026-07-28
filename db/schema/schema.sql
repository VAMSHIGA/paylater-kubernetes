-- ===========================
-- Customers Table
-- ===========================
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    credit_limit DECIMAL(10,2) NOT NULL,
    repay DECIMAL(10,2) DEFAULT 0.00
);

-- ===========================
-- Merchants Table
-- ===========================
CREATE TABLE merchants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    onboarding DATE NOT NULL,
    commission DECIMAL(5,2) NOT NULL
);

-- ===========================
-- Transactions Table
-- ===========================
CREATE TABLE transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,

    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,

    CONSTRAINT fk_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_merchant
        FOREIGN KEY (merchant_id)
        REFERENCES merchants(id)
        ON DELETE CASCADE
);

-- ===========================
-- Paybacks Table
-- ===========================
CREATE TABLE paybacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    customer_id BIGINT NOT NULL,

    amount DECIMAL(10,2) NOT NULL,

    payment_date DATE NOT NULL,

    CONSTRAINT fk_payback_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
);