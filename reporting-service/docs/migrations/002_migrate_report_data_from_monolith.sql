-- Copy reporting read-model data from the monolith database into report_db.
-- Preserves primary key values for cross-table references within the snapshot.
-- Adjust source database name if your monolith DB is not paylater_tables.

INSERT INTO report_db.customers (
    id,
    name,
    email,
    credit_limit
)
SELECT
    id,
    name,
    email,
    credit_limit
FROM paylater_tables.customers
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    credit_limit = VALUES(credit_limit);

SET @next_customer_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM report_db.customers);
SET @alter_sql := CONCAT('ALTER TABLE report_db.customers AUTO_INCREMENT = ', @next_customer_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;

INSERT INTO report_db.merchants (
    id,
    merchant_name,
    phone_number,
    onboarding,
    commission
)
SELECT
    id,
    merchant_name,
    phone_number,
    onboarding,
    commission
FROM paylater_tables.merchants
ON DUPLICATE KEY UPDATE
    merchant_name = VALUES(merchant_name),
    phone_number = VALUES(phone_number),
    onboarding = VALUES(onboarding),
    commission = VALUES(commission);

SET @next_merchant_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM report_db.merchants);
SET @alter_sql := CONCAT('ALTER TABLE report_db.merchants AUTO_INCREMENT = ', @next_merchant_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;

INSERT INTO report_db.transactions (
    id,
    customer_id,
    merchant_id,
    amount,
    commission,
    transaction_date
)
SELECT
    id,
    customer_id,
    merchant_id,
    amount,
    commission,
    transaction_date
FROM paylater_tables.transactions
ON DUPLICATE KEY UPDATE
    customer_id = VALUES(customer_id),
    merchant_id = VALUES(merchant_id),
    amount = VALUES(amount),
    commission = VALUES(commission),
    transaction_date = VALUES(transaction_date);

SET @next_transaction_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM report_db.transactions);
SET @alter_sql := CONCAT('ALTER TABLE report_db.transactions AUTO_INCREMENT = ', @next_transaction_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;

INSERT INTO report_db.paybacks (
    id,
    customer_id,
    amount,
    payment_date
)
SELECT
    id,
    customer_id,
    amount,
    payment_date
FROM paylater_tables.paybacks
ON DUPLICATE KEY UPDATE
    customer_id = VALUES(customer_id),
    amount = VALUES(amount),
    payment_date = VALUES(payment_date);

SET @next_payback_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM report_db.paybacks);
SET @alter_sql := CONCAT('ALTER TABLE report_db.paybacks AUTO_INCREMENT = ', @next_payback_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;
