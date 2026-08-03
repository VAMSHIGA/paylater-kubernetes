-- ===========================
-- Authentication Queries
-- ===========================
-- SQLC inputs for Identity Service (identity_db).
-- CreateUser persists bcrypt hashes; GetUserByEmail supports login.
-- Generated Go lives in db/sqlc — do not edit generated files.

-- name: CreateUser :execresult
INSERT INTO users (
    email,
    password_hash,
    role
)
VALUES (?, ?, ?);

-- name: GetUserByEmail :one
SELECT
    id,
    email,
    password_hash,
    role
FROM users
WHERE email = ?;
