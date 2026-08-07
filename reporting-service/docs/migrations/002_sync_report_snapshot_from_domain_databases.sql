-- Refresh report_db snapshot from domain microservice databases.
-- Run manually when needed, or rely on Reporting Service startup/request refresh.
--
-- Requires the same MySQL server and credentials with read access to source DBs.

USE report_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE paybacks;
TRUNCATE TABLE transactions;
TRUNCATE TABLE merchants;
TRUNCATE TABLE customers;

INSERT INTO customers (id, name, email, credit_limit)
SELECT id, name, email, credit_limit
FROM customer_db.customers;

INSERT INTO merchants (id, merchant_name, phone_number, onboarding, commission)
SELECT id, merchant_name, phone_number, onboarding, commission
FROM merchant_db.merchants;

INSERT INTO transactions (id, customer_id, merchant_id, amount, commission, transaction_date)
SELECT id, customer_id, merchant_id, amount, commission, transaction_date
FROM transaction_db.transactions;

INSERT INTO paybacks (id, customer_id, amount, payment_date)
SELECT id, customer_id, amount, payment_date
FROM payback_db.paybacks;

SET FOREIGN_KEY_CHECKS = 1;
