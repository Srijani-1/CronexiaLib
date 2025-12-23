import sqlite3

db_path = r'c:\Users\srijani\projects\AgentHub\backend\agent_hub.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column_if_missing(table, column, col_type):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [col[1] for col in cursor.fetchall()]
    if column not in columns:
        print(f"Adding {column} to {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        conn.commit()
    else:
        print(f"{table}.{column} already exists")

try:
    add_column_if_missing(
        "community_discussions",
        "group_id",
        "INTEGER"
    )

except Exception as e:
    print(f"Migration error: {e}")
finally:
    conn.close()
