# database/mysql_client.py
import os
import mysql.connector
from dotenv import load_dotenv

# load .env
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "")
MYSQL_DB   = os.getenv("MYSQL_DB", "company")

# connect to MySQL
conn = mysql.connector.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASS,
    database=MYSQL_DB,
    autocommit=True
)

# fetch employee info
def get_user(employee_id: int):
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.employee_id, e.name, e.email, e.phone, e.join_date,
               r.role_id, r.role_name,
               d.depart_id, d.depart_name
        FROM employee e
        LEFT JOIN role r ON e.role_id = r.role_id
        LEFT JOIN department d ON e.depart_id = d.depart_id
        WHERE e.employee_id = %s
    """, (employee_id,))
    return cursor.fetchone()

# fetch projects for a department
def get_projects_for_department(depart_id: int):
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT project_id, project_name FROM project WHERE depart_id = %s",
        (depart_id,)
    )
    return cursor.fetchall()
