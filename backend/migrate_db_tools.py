import sqlite3

db_path = r'c:\Users\srijani\projects\AgentHub\backend\agent_hub.db'

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def column_exists(table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return column in [col[1] for col in cursor.fetchall()]

try:
    # ---- TOOLS TABLE ----
    print("Checking 'tools' table...")
    if not column_exists("tools", "instructions"):
        print("Adding 'instructions' column to 'tools' table...")
        cursor.execute(
            "ALTER TABLE tools ADD COLUMN instructions TEXT"
        )
    else:
        print("'instructions' already exists in 'tools'.")

    # ---- COMMUNITY_GROUPS TABLE ----
    print("Checking 'community_groups' table...")
    if not column_exists("community_groups", "owner_id"):
        print("Adding 'owner_id' column to 'community_groups' table...")
        cursor.execute(
            "ALTER TABLE community_groups ADD COLUMN owner_id INTEGER"
        )
    else:
        print("'owner_id' already exists in 'community_groups'.")

    conn.commit()
    print("✅ Database migration completed successfully.")

except Exception as e:
    print(f"❌ Migration error: {e}")

finally:
    conn.close()
