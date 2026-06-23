from database.db import get_db_connection

# Columns to ensure in `profile` table: (column_name, definition_sql)
COLUMNS = [
    ('created_at', 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP'),
    ('dob', 'DATE NULL'),
    ('age', 'INT NULL'),
    ('marital_status', "VARCHAR(50) NULL"),
    ('street', "VARCHAR(255) NULL"),
    ('city', "VARCHAR(100) NULL"),
    ('state', "VARCHAR(100) NULL"),
    ('pincode', "VARCHAR(20) NULL"),
    ('country', "VARCHAR(100) NULL"),
    ('emergency_contact_primary_name', "VARCHAR(100) NULL"),
    ('emergency_contact_primary_relationship', "VARCHAR(50) NULL"),
    ('emergency_contact_primary_phone', "VARCHAR(20) NULL"),
    ('emergency_contact_secondary_name', "VARCHAR(100) NULL"),
    ('emergency_contact_secondary_relationship', "VARCHAR(50) NULL"),
    ('emergency_contact_secondary_phone', "VARCHAR(20) NULL"),
    ('aadhaar_last4', "VARCHAR(4) NULL"),
    ('pan_last4', "VARCHAR(4) NULL"),
    ('aadhaar_file_name', "VARCHAR(255) NULL"),
    ('pan_file_name', "VARCHAR(255) NULL"),
    ('account_mask', "VARCHAR(64) NULL"),
    ('ifsc_code', "VARCHAR(32) NULL"),
    ('bank_name', "VARCHAR(150) NULL"),
    ('branch', "VARCHAR(150) NULL"),
    ('occupation', "VARCHAR(100) NULL"),
    ('company', "VARCHAR(150) NULL"),
    ('designation', "VARCHAR(100) NULL"),
    ('employment_type', "VARCHAR(50) NULL"),
    ('experience', "VARCHAR(50) NULL"),
    ('income', "VARCHAR(50) NULL"),
    ('profile_locked', "TINYINT(1) NOT NULL DEFAULT 0"),
]


def ensure_columns():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        for col, definition in COLUMNS:
            cursor.execute(
                "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'profile' AND column_name = %s",
                (col,),
            )
            exists = cursor.fetchone()[0] > 0
            if exists:
                print(f"Column '{col}' already exists")
                continue
            alter = f"ALTER TABLE profile ADD COLUMN {col} {definition}"
            try:
                cursor.execute(alter)
                print(f"Added column: {col}")
            except Exception as e:
                print(f"Failed to add {col}: {e}")
        conn.commit()
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        conn.close()


if __name__ == '__main__':
    ensure_columns()
