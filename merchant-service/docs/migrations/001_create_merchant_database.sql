-- Merchant Service database bootstrap.
-- Run as a user with CREATE DATABASE privilege.

CREATE DATABASE IF NOT EXISTS merchant_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE merchant_db;

-- merchants table (owned exclusively by Merchant Service)

CREATE TABLE IF NOT EXISTS merchants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    onboarding DATE NOT NULL,
    commission DECIMAL(5,2) NOT NULL
);
