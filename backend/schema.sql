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

-- ═════════════════════════════════════════════════════════
--  LOAN APPLICATION TABLES
-- ═════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
--  Core loan application
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_applications (
    loan_id            INT          PRIMARY KEY AUTO_INCREMENT,
    application_id     VARCHAR(30)  NOT NULL UNIQUE COMMENT 'EZL-YYYY-NNNN format',
    user_id            INT          NOT NULL,

    -- Step 1: Loan Selection
    loan_type          VARCHAR(50)  NULL COMMENT 'Personal Loan | Home Loan | Business Loan | Vehicle Loan | Gold Loan',

    -- Step 2: Loan Information
    amount             DECIMAL(12,2) NULL,
    tenure_months      INT          NULL,
    purpose            VARCHAR(100) NULL,
    interest_rate      DECIMAL(5,2) NULL DEFAULT 10.50,
    processing_fee     DECIMAL(10,2) NULL DEFAULT 999.00,

    -- Step 3: Applicant details (pre-filled from profile, editable)
    applicant_name     VARCHAR(200) NULL,
    applicant_dob      DATE         NULL,
    applicant_gender   VARCHAR(20)  NULL,
    applicant_phone    VARCHAR(15)  NULL,
    applicant_email    VARCHAR(150) NULL,
    applicant_address  TEXT         NULL,

    -- Step 4: KYC
    aadhaar_number     VARCHAR(32)  NULL,
    pan_number         VARCHAR(16)  NULL,

    -- Step 5: Income & Employment
    employment_type    VARCHAR(50)  NULL COMMENT 'Salaried | Self Employed',
    company_name       VARCHAR(150) NULL,
    designation        VARCHAR(100) NULL,
    monthly_income     DECIMAL(12,2) NULL,
    total_experience   VARCHAR(50)  NULL,
    current_exp        VARCHAR(50)  NULL,

    -- Flags
    has_co_applicant   TINYINT(1)  NOT NULL DEFAULT 0,
    has_guarantor      TINYINT(1)  NOT NULL DEFAULT 0,

    -- Legal
    agreed_terms       TINYINT(1)  NOT NULL DEFAULT 0,
    esign_consent      TINYINT(1)  NOT NULL DEFAULT 0,

    -- Workflow status
    -- draft | submitted | verification_in_progress | verified | disbursement_pending | disbursed | rejected | disbursement_rejected | closed
    status             VARCHAR(40)  NOT NULL DEFAULT 'draft',
    current_step       INT          NOT NULL DEFAULT 0 COMMENT '0-indexed UI step user left off at',

    -- Assigned staff (set by admin/system after submission)
    assigned_verifier  INT          NULL,
    assigned_disburser INT          NULL,

    -- Timestamps
    submitted_at       DATETIME     NULL,
    verified_at        DATETIME     NULL,
    disbursed_at       DATETIME     NULL,
    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_loan_user      FOREIGN KEY (user_id)            REFERENCES users(user_id)                  ON DELETE CASCADE,
    CONSTRAINT fk_loan_verifier  FOREIGN KEY (assigned_verifier)  REFERENCES verifiers(verifier_id)          ON DELETE SET NULL,
    CONSTRAINT fk_loan_disburser FOREIGN KEY (assigned_disburser) REFERENCES disbursement_officers(disburser_id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────
--  Co-Applicant (optional, one per loan)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_co_applicants (
    co_id              INT          PRIMARY KEY AUTO_INCREMENT,
    loan_id            INT          NOT NULL UNIQUE,

    -- Personal
    full_name          VARCHAR(200) NULL,
    relationship       VARCHAR(50)  NULL,
    aadhaar_number     VARCHAR(32)  NULL,
    pan_number         VARCHAR(16)  NULL,

    -- Income
    employment_type    VARCHAR(50)  NULL,
    monthly_gross      DECIMAL(12,2) NULL,
    monthly_net        DECIMAL(12,2) NULL,
    organization       VARCHAR(150) NULL,
    rental_income      DECIMAL(12,2) NULL DEFAULT 0,
    other_income       DECIMAL(12,2) NULL DEFAULT 0,

    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_co_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────
--  Guarantor (optional, one per loan)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_guarantors (
    guarantor_id       INT          PRIMARY KEY AUTO_INCREMENT,
    loan_id            INT          NOT NULL UNIQUE,

    -- Personal / KYC
    full_name          VARCHAR(200) NULL,
    aadhaar_number     VARCHAR(32)  NULL,
    pan_number         VARCHAR(16)  NULL,

    -- Income
    employment_type    VARCHAR(50)  NULL COMMENT 'Salaried | Self Employed',
    annual_income      DECIMAL(12,2) NULL,
    monthly_net        DECIMAL(12,2) NULL,
    employer_name      VARCHAR(150) NULL,
    industry           VARCHAR(100) NULL,
    years_at_job       VARCHAR(20)  NULL,

    created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_guarantor_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────
--  Loan Documents (uploaded files per application)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_documents (
    doc_id             INT          PRIMARY KEY AUTO_INCREMENT,
    loan_id            INT          NOT NULL,
    user_id            INT          NOT NULL,

    -- doc_type: aadhaar_scan | pan_scan | passport_photo | bank_statement
    --           salary_slip | co_aadhaar | co_pan | co_photo
    --           guarantor_aadhaar | guarantor_pan | guarantor_photo | other
    doc_type           VARCHAR(50)  NOT NULL,
    original_name      VARCHAR(255) NOT NULL,
    stored_name        VARCHAR(255) NOT NULL UNIQUE,
    mime_type          VARCHAR(100) NULL,
    file_size_kb       INT          NULL,

    -- verified_by verifier after submission
    is_verified        TINYINT(1)  NOT NULL DEFAULT 0,
    verified_by        INT          NULL,
    verified_at        DATETIME     NULL,
    verifier_note      TEXT         NULL,

    uploaded_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ldoc_loan     FOREIGN KEY (loan_id)     REFERENCES loan_applications(loan_id) ON DELETE CASCADE,
    CONSTRAINT fk_ldoc_user     FOREIGN KEY (user_id)     REFERENCES users(user_id)             ON DELETE CASCADE,
    CONSTRAINT fk_ldoc_verifier FOREIGN KEY (verified_by) REFERENCES verifiers(verifier_id)     ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────
--  Status History (full audit trail)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loan_status_history (
    history_id         INT          PRIMARY KEY AUTO_INCREMENT,
    loan_id            INT          NOT NULL,
    from_status        VARCHAR(40)  NULL,
    to_status          VARCHAR(40)  NOT NULL,
    changed_by_role    VARCHAR(20)  NOT NULL COMMENT 'user | verifier | disburser | admin | system',
    changed_by_id      INT          NULL,
    note               TEXT         NULL,
    changed_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_hist_loan FOREIGN KEY (loan_id) REFERENCES loan_applications(loan_id) ON DELETE CASCADE
);
