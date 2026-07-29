-- ===========================
-- Authentication Queries
-- ===========================

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