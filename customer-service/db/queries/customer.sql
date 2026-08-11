-- ===========================
-- Customer Queries
-- ===========================
-- Contains SQL queries used by SQLC
-- for customer-related database operations.


-- ===========================
-- Create Customer
-- ===========================
-- Creates a new customer with:
-- name, email, credit limit, and optional identity user_id link.
--
-- SQLC generates:
-- CreateCustomer(ctx, params)

-- name: CreateCustomer :execresult
INSERT INTO customers (
    user_id,
    name,
    email,
    credit_limit
)
VALUES (?, ?, ?, ?);


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
    user_id,
    name,
    email,
    credit_limit
FROM customers
ORDER BY id ASC;


-- ===========================
-- Get Customer ID By User ID
-- ===========================
-- Resolves the customer profile owned by an identity user.
--
-- SQLC generates:
-- GetCustomerIDByUserID(ctx, user_id)

-- name: GetCustomerIDByUserID :one
SELECT id
FROM customers
WHERE user_id = ?
LIMIT 1;
