-- Customer Service database bootstrap.
-- Run as a user with CREATE DATABASE privilege.

CREATE DATABASE IF NOT EXISTS customer_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE customer_db;

-- customers table (owned exclusively by Customer Service)

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    credit_limit DECIMAL(10,2) NOT NULL
);
