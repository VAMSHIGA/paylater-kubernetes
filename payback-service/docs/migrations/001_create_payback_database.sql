-- Payback Service database bootstrap.
-- Run as a user with CREATE DATABASE privilege.
--
-- Note: customer_id is a logical reference only.
-- Foreign keys to customers are not enforced in payback_db
-- because the customers table is owned by Customer Service (customer_db).

CREATE DATABASE IF NOT EXISTS payback_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE payback_db;

-- paybacks table (owned exclusively by Payback Service)

CREATE TABLE IF NOT EXISTS paybacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL
);
