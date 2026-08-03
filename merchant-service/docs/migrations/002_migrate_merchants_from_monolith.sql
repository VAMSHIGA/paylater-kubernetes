-- Copy existing merchants from the monolith database into merchant_db.
-- Preserves primary key values for cross-module FK compatibility.
-- Adjust source database name if your monolith DB is not paylater_tables.

INSERT INTO merchant_db.merchants (id, merchant_name, phone_number, onboarding, commission)
SELECT id, merchant_name, phone_number, onboarding, commission
FROM paylater_tables.merchants
ON DUPLICATE KEY UPDATE
    merchant_name = VALUES(merchant_name),
    phone_number = VALUES(phone_number),
    onboarding = VALUES(onboarding),
    commission = VALUES(commission);

-- Align AUTO_INCREMENT with the highest migrated id.
SET @next_merchant_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM merchant_db.merchants);
SET @alter_sql := CONCAT('ALTER TABLE merchant_db.merchants AUTO_INCREMENT = ', @next_merchant_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;
