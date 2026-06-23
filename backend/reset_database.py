import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

DB_HOST = os.getenv('MYSQL_HOST', '127.0.0.1')
DB_PORT = int(os.getenv('MYSQL_PORT', '3306'))
DB_USER = os.getenv('MYSQL_USER', 'root')
DB_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
DB_NAME = os.getenv('MYSQL_DATABASE', 'loan')


def connect(database=None):
    cfg = {
        'host': DB_HOST,
        'port': DB_PORT,
        'user': DB_USER,
        'password': DB_PASSWORD,
    }
    if database:
        cfg['database'] = database
    return mysql.connector.connect(**cfg)


def execute_statements(cursor, statements):
    for statement in statements:
        cursor.execute(statement)


def main():
    conn = connect()
    try:
        cur = conn.cursor()
        cur.execute(f"DROP DATABASE IF EXISTS `{DB_NAME}`")
        cur.execute(f"CREATE DATABASE `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.commit()
        cur.close()
    finally:
        conn.close()

    conn = connect(DB_NAME)
    try:
        cur = conn.cursor()

        execute_statements(cur, [
            """
            CREATE TABLE users (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                phone_number VARCHAR(15) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                address VARCHAR(255) NULL,
                gender VARCHAR(20) NULL,
                aadhaar_number VARCHAR(32) NULL,
                aadhaar_status VARCHAR(20) NOT NULL DEFAULT 'not_added',
                pan_number VARCHAR(16) NULL,
                pan_status VARCHAR(20) NOT NULL DEFAULT 'not_added',
                last_login_at DATETIME NULL,
                sms_notifications TINYINT(1) NOT NULL DEFAULT 1,
                email_notifications TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE admin (
                admin_id INT PRIMARY KEY AUTO_INCREMENT,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE profile (
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
            )
            """,
        ])
        conn.commit()

        cur.execute("SHOW TABLES")
        tables = [row[0] for row in cur.fetchall()]
        print('Reset complete. Tables:', ', '.join(tables))
    finally:
        try:
            cur.close()
        except Exception:
            pass
        conn.close()


if __name__ == '__main__':
    main()
