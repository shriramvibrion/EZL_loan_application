CREATE DATABASE IF NOT EXISTS loan;
USE loan;

CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL,
ADD COLUMN IF NOT EXISTS aadhaar_number VARCHAR(32) NULL,
ADD COLUMN IF NOT EXISTS aadhaar_status VARCHAR(20) NOT NULL DEFAULT 'not_added',
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(16) NULL,
ADD COLUMN IF NOT EXISTS pan_status VARCHAR(20) NOT NULL DEFAULT 'not_added',
ADD COLUMN IF NOT EXISTS last_login_at DATETIME NULL,
ADD COLUMN IF NOT EXISTS sms_notifications TINYINT(1) NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS email_notifications TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS admin (
    admin_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE admin 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP;

DROP TABLE IF EXISTS profile_documents;
DROP TABLE IF EXISTS user_sessions;

CREATE TABLE IF NOT EXISTS profile (
    profile_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    email VARCHAR(150) NOT NULL,
    address VARCHAR(255) NULL,
    gender VARCHAR(20) NULL,
    dob DATE NULL,
    marital_status VARCHAR(50) NULL,
    aadhaar_number VARCHAR(32) NULL,
    aadhaar_last4 VARCHAR(4) NULL,
    aadhaar_status VARCHAR(20) NOT NULL DEFAULT 'not_added',
    pan_number VARCHAR(16) NULL,
    pan_last4 VARCHAR(4) NULL,
    pan_status VARCHAR(20) NOT NULL DEFAULT 'not_added',
    title VARCHAR(100) NULL,
    company VARCHAR(150) NULL,
    designation VARCHAR(100) NULL,
    employment_type VARCHAR(50) NULL,
    experience VARCHAR(50) NULL,
    income VARCHAR(50) NULL,
    photo TEXT NULL,
    completion_percent INT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,
    country VARCHAR(100) NULL,
    bank_name VARCHAR(150) NULL,
    account_mask VARCHAR(64) NULL,
    ifsc_code VARCHAR(32) NULL,
    branch VARCHAR(150) NULL,
    aadhaar_file_name VARCHAR(255) NULL,
    pan_file_name VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- sample selects
SELECT * FROM users;
SELECT * FROM admin;

-- ─────────────────────────────────────────────────────────
--  Verifier table
--  Created by admin; no self-registration allowed.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verifiers (
    verifier_id   INT PRIMARY KEY AUTO_INCREMENT,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password      VARCHAR(255)  NOT NULL,
    -- Status: active | inactive (admin can deactivate)
    status        VARCHAR(20)   NOT NULL DEFAULT 'active',
    created_by    INT           NULL COMMENT 'admin_id who created this verifier',
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME      NULL,
    CONSTRAINT fk_verifier_created_by FOREIGN KEY (created_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────
--  Disbursement Officers table
--  Created by admin; no self-registration allowed.
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disbursement_officers (
    disburser_id  INT PRIMARY KEY AUTO_INCREMENT,
    first_name    VARCHAR(100)  NOT NULL,
    last_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password      VARCHAR(255)  NOT NULL,
    -- Status: active | inactive (admin can deactivate)
    status        VARCHAR(20)   NOT NULL DEFAULT 'active',
    created_by    INT           NULL COMMENT 'admin_id who created this officer',
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME      NULL,
    CONSTRAINT fk_disburser_created_by FOREIGN KEY (created_by) REFERENCES admin(admin_id) ON DELETE SET NULL
);
