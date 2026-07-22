"""
Alembic environment configuration for TurnoGO.

Reads DATABASE_URL from environment variable (same as app.database).
Imports all models so autogenerate detects every table.
"""
import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# -- Ensure the backend root is on sys.path so `app` imports work --
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# -- Import Base and ALL models (required for autogenerate) --
from app.database import Base
from app.models import (  # noqa: F401 — imported for autogenerate
    User,
    Job,
    Application,
    Transaction,
    Rating,
    RefreshToken,
    AuditLog,
    Notification,
    PushSubscription,
    ChangeToken,
)

# Alembic Config object
config = context.config

# Setup loggers from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# -- Override sqlalchemy.url from DATABASE_URL env var --
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./freelance.db")
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# -- Metadata for autogenerate --
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (generate SQL without connecting)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connect to DB and apply)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    # SQLite needs check_same_thread=False
    if DATABASE_URL.startswith("sqlite"):
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
            connect_args={"check_same_thread": False},
        )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
