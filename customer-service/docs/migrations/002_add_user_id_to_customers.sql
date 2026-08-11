-- Customer Service additive migration: link customers to identity users.
-- Safe to run on existing databases. Does not drop data.
-- Run: mysql -u root -p < customer-service/docs/migrations/002_add_user_id_to_customers.sql

USE customer_db;

-- Add nullable ownership column (one customer profile per identity user).
ALTER TABLE customers
    ADD COLUMN user_id BIGINT NULL;

ALTER TABLE customers
    ADD UNIQUE INDEX idx_customers_user_id (user_id);

-- Backfill ownership for existing rows where emails match a customer-role user.
UPDATE customer_db.customers AS c
INNER JOIN identity_db.users AS u
    ON c.email = u.email AND u.role = 'customer'
SET c.user_id = u.id
WHERE c.user_id IS NULL;
