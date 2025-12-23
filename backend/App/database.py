import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# ✅ Use environment variable or fallback to default SQLite
DB_URL = os.getenv(
    "DATABASE_URL",
    r"sqlite:///./agent_hub.db"
)

# ✅ For SQLite we need "check_same_thread"
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, connect_args=connect_args)

# ✅ Print which DB is being used (debugging)
print("📦 Using DB file at:", os.path.abspath(DB_URL.replace("sqlite:///", "")))

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()