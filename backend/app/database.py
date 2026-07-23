import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Lee DATABASE_URL del entorno; fallback a SQLite local
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./freelance.db")

# SQLite necesita check_same_thread, PostgreSQL no
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
