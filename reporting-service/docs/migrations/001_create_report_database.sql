-- Reporting Service database bootstrap.
-- Run as a user with CREATE DATABASE privilege.
--
-- report_db is a read-model snapshot for reporting queries.
-- Tables mirror paylater_tables structure required by report.sql.

CREATE DATABASE IF NOT EXISTS report_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE report_db;

CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    credit_limit DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS merchants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    merchant_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    onboarding DATE NOT NULL,
    commission DECIMAL(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    merchant_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    transaction_date DATE NOT NULL,
    CONSTRAINT fk_transaction_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id),
    CONSTRAINT fk_transaction_merchant
        FOREIGN KEY (merchant_id)
        REFERENCES merchants(id)
);

CREATE TABLE IF NOT EXISTS paybacks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    CONSTRAINT fk_payback_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);
