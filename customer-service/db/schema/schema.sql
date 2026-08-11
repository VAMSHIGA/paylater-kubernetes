-- ===========================
-- Customers Table
-- ===========================
-- Stores customer information for the PayLater system.
-- Each customer has a unique ID, name, email,
-- and an approved credit limit.

CREATE TABLE customers (

    -- Unique customer identifier.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Identity user that owns this customer profile (identity_db.users.id).
    -- NULL for legacy admin-created profiles not yet linked.
    user_id BIGINT NULL,

    -- Customer's full name.
    name VARCHAR(100) NOT NULL,

    -- Customer's email address.
    -- Must be unique for each customer.
    email VARCHAR(100) NOT NULL UNIQUE,

    -- Maximum credit limit assigned
    -- to the customer.
    credit_limit DECIMAL(10,2) NOT NULL,

    UNIQUE KEY idx_customers_user_id (user_id)
);
