from database.db import get_db_connection
import os

SQL_FILE = os.path.join(os.path.dirname(__file__), 'schema.sql')


def apply_sql_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        sql = f.read()

    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Naive split on semicolons; skip empty/whitespace-only statements
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        for stmt in statements:
            try:
                cursor.execute(stmt)
            except Exception as e:
                # print and continue for idempotency
                print('Failed statement:', stmt[:80].replace('\n', ' '), '...')
                print('Error:', e)
        conn.commit()
        print('Schema applied (attempted)')
    finally:
        try:
            cursor.close()
        except Exception:
            pass
        conn.close()


if __name__ == '__main__':
    apply_sql_file(SQL_FILE)
