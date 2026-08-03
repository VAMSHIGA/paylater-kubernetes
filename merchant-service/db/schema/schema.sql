-- ===========================
-- Merchants Table
-- ===========================
-- Stores merchant information in the PayLater system.
-- A merchant is a business where customers can use
-- their PayLater credit.

CREATE TABLE merchants (

    -- Unique identifier for each merchant.
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Name of the merchant/business.
    merchant_name VARCHAR(100) NOT NULL,

    -- Merchant's contact phone number.
    phone_number VARCHAR(20) NOT NULL,

    -- Date when the merchant joined/onboarded
    -- into the PayLater system.
    onboarding DATE NOT NULL,

    -- Commission percentage charged to the merchant.
    -- Example: 5.00 means 5%.
    commission DECIMAL(5,2) NOT NULL
);
