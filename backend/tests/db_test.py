from dotenv import load_dotenv
import os
import mysql.connector


def main():
    load_dotenv('.env.example')
    cfg = {
        'host': os.getenv('MYSQL_HOST'),
        'port': int(os.getenv('MYSQL_PORT')) if os.getenv('MYSQL_PORT') else None,
        'user': os.getenv('MYSQL_USER'),
        'password': os.getenv('MYSQL_PASSWORD'),
        'database': os.getenv('MYSQL_DATABASE'),
    }

    # remove None values
    conn_cfg = {k: v for k, v in cfg.items() if v is not None}
    print('DB_CONFIG ->', conn_cfg)

    try:
        conn = mysql.connector.connect(**conn_cfg)
        print('Connection established')
        conn.close()
    except Exception as e:
        print('Connection error:', e)


if __name__ == '__main__':
    main()
