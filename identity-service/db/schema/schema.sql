-- ===========================
-- Users Table
-- ===========================
-- Stores login information for authentication
-- and role information for authorization.

CREATE TABLE users (

    -- Unique user identifier.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Email used to login.
    -- Every user must have a unique email.
    email VARCHAR(100) NOT NULL UNIQUE,

    -- Stores the hashed password.
    -- Never store the plain password.
    password_hash VARCHAR(255) NOT NULL,

    -- Used for authorization.
    -- Example roles:
    -- admin
    -- customer
    -- merchant
    role VARCHAR(50) NOT NULL
);
