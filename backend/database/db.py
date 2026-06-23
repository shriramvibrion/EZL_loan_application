import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST"),
    "port": os.getenv("MYSQL_PORT", "3306"),
    "user": os.getenv("MYSQL_USER"),
    "password": os.getenv("MYSQL_PASSWORD"),  # os.getenv("MYSQL_PASSWORD"),
    "database": os.getenv("MYSQL_DATABASE")
}

def get_db_connection():
    connection_config = {key: value for key, value in DB_CONFIG.items() if value not in (None, "")}
    return mysql.connector.connect(**connection_config)


def test_db_connection():
    try:
        conn = get_db_connection()
        conn.close()
        return True, None
    except Exception as e:
        return False, e