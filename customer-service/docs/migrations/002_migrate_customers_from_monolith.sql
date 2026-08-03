-- Copy existing customers from the monolith database into customer_db.
-- Preserves primary key values for cross-module FK compatibility.
-- Adjust source database name if your monolith DB is not paylater_tables.

INSERT INTO customer_db.customers (id, name, email, credit_limit)
SELECT id, name, email, credit_limit
FROM paylater_tables.customers
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email),
    credit_limit = VALUES(credit_limit);

-- Align AUTO_INCREMENT with the highest migrated id.
SET @next_customer_id := (SELECT COALESCE(MAX(id), 0) + 1 FROM customer_db.customers);
SET @alter_sql := CONCAT('ALTER TABLE customer_db.customers AUTO_INCREMENT = ', @next_customer_id);
PREPARE alter_stmt FROM @alter_sql;
EXECUTE alter_stmt;
DEALLOCATE PREPARE alter_stmt;
