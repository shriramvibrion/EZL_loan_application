import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()
conn = mysql.connector.connect(
    host=os.getenv('MYSQL_HOST', '127.0.0.1'),
    port=int(os.getenv('MYSQL_PORT', '3306')),
    user=os.getenv('MYSQL_USER', 'root'),
    password=os.getenv('MYSQL_PASSWORD', ''),
    database=os.getenv('MYSQL_DATABASE', 'loan'),
)
cur = conn.cursor()
cur.execute('SELECT DATABASE()')
print('database=', cur.fetchone()[0])
cur.execute('SHOW TABLES')
print('tables=', [row[0] for row in cur.fetchall()])
cur.execute('SHOW COLUMNS FROM profile')
print('profile_columns=', [row[0] for row in cur.fetchall()])
cur.close()
conn.close()
