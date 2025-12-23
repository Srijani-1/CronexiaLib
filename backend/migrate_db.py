import sqlite3
import os

db_path = r'c:\Users\srijani\projects\AgentHub\backend\agent_hub.db'

if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("Checking for 'instructions' column in 'agents' table...")
    cursor.execute("PRAGMA table_info(agents)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'instructions' not in columns:
        print("Adding 'instructions' column to 'agents' table...")
        cursor.execute("ALTER TABLE agents ADD COLUMN instructions TEXT")
        conn.commit()
        print("Column added successfully.")
    else:
        print("'instructions' column already exists.")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
