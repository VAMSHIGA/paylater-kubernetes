-- Copy existing transactions from the monolith database into transaction_db.
-- Preserves primary key values for cross-module reference compatibility.
-- Adjust source database name if your monolith DB is not paylater_tables.

INSERT INTO transaction_db.transactions (
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

-- Align AUTO_INCREMENT with the highest migrated id.
SET @next_transaction_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM transaction_db.transactions);
SET @alter_sql := CONCAT('ALTER TABLE transaction_db.transactions AUTO_INCREMENT = ', @next_transaction_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;
