-- ===========================
-- Customers Table
-- ===========================
-- Stores customer information for the PayLater system.
-- Each customer has a unique ID, name, email,
-- and an approved credit limit.

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
