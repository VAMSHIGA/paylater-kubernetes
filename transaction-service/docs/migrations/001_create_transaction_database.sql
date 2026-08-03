-- Transaction Service database bootstrap.
-- Run as a user with CREATE DATABASE privilege.
--
-- Note: customer_id and merchant_id are logical references only.
-- Foreign keys to customers/merchants are not enforced in transaction_db
-- because those tables are owned by Customer and Merchant services.

CREATE DATABASE IF NOT EXISTS transaction_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE transaction_db;

-- transactions table (owned exclusively by Transaction Service)

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL
);
