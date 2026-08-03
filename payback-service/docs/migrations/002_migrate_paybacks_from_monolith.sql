-- Copy existing paybacks from the monolith database into payback_db.
-- Preserves primary key values for cross-module reference compatibility.
-- Adjust source database name if your monolith DB is not paylater_tables.

INSERT INTO payback_db.paybacks (
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

-- Align AUTO_INCREMENT with the highest migrated id.
SET @next_payback_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM payback_db.paybacks);
SET @alter_sql := CONCAT('ALTER TABLE payback_db.paybacks AUTO_INCREMENT = ', @next_payback_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;
