-- Copy existing users from the monolith database into identity_db.
-- Adjust source database name if your monolith DB is not paylater_tables.

INSERT INTO identity_db.users (id, email, password_hash, role)
SELECT id, email, password_hash, role
FROM paylater_tables.users
ON DUPLICATE KEY UPDATE
    email = VALUES(email),
    password_hash = VALUES(password_hash),
    role = VALUES(role);
