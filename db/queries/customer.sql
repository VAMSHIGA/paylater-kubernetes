-- ===========================
-- Customer Queries
-- ===========================
-- Contains SQL queries used by SQLC
-- for customer-related database operations.


-- ===========================
-- Create Customer
-- ===========================
-- Creates a new customer with:
-- name, email and credit limit.
--
-- SQLC generates:
-- CreateCustomer(ctx, params)

-- name: CreateCustomer :execresult
INSERT INTO customers (
    name,
    email,
    credit_limit
)
VALUES (?, ?, ?);


-- ===========================
-- List Customers
-- ===========================
-- Retrieves all customers from the database.
--
-- Customers are returned in ascending order
-- based on their ID.
--
-- SQLC generates:
-- ListCustomers(ctx)

-- name: ListCustomers :many
SELECT
    id,
    name,
    email,
    credit_limit
FROM customers
ORDER BY id ASC;
