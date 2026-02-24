"""
Database engine creation with PostgreSQL → SQLite fallback.

On import this module exposes:
    Base          – declarative base for SQLAlchemy models
    engine        – current database engine (set after create_database_engine())
    SessionLocal  – scoped session factory
    db_type       – 'postgresql' | 'sqlite' | None
    get_db()      – FastAPI dependency yielding a DB session
"""

from __future__ import annotations

import logging
from typing import Optional, Tuple

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------
Base = declarative_base()

engine = None
SessionLocal: Optional[sessionmaker] = None
db_type: Optional[str] = None
_db_healthy = False


# ---------------------------------------------------------------------------
# Engine creation
# ---------------------------------------------------------------------------
def create_database_engine() -> Tuple[bool, str]:
    """Try PostgreSQL first; fall back to SQLite on failure."""
    global engine, SessionLocal, db_type, _db_healthy

    # --- Attempt PostgreSQL ---
    try:
        masked_url = settings.database_url.split("@")[-1] if "@" in settings.database_url else settings.database_url
        logger.info("Connecting to PostgreSQL (%s) …", masked_url)

        pg_engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 5},
        )
        with pg_engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        engine = pg_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db_type = "postgresql"
        _db_healthy = True
        logger.info("PostgreSQL connection OK")
        return True, "postgresql"

    except Exception as exc:
        logger.warning("PostgreSQL unavailable: %s", exc)
        logger.warning("Falling back to SQLite for local development …")

    # --- Fallback: SQLite ---
    try:
        sqlite_url = "sqlite:///./dev.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db_type = "sqlite"
        _db_healthy = True
        logger.warning("Using SQLite (./dev.db) — DEVELOPMENT ONLY")
        return False, "sqlite"

    except Exception as sqlite_exc:
        logger.critical("SQLite fallback also failed: %s", sqlite_exc)
        _db_healthy = False
        raise RuntimeError("All database backends failed") from sqlite_exc


# ---------------------------------------------------------------------------
# Schema helpers (SQLite only)
# ---------------------------------------------------------------------------
def _schema_needs_rebuild() -> bool:
    """Return True when the SQLite schema is stale (missing expected columns)."""
    if not engine or db_type != "sqlite":
        return False
    try:
        inspector = inspect(engine)
        if "tryon_sessions" not in inspector.get_table_names():
            return False
        columns = {col["name"] for col in inspector.get_columns("tryon_sessions")}
        return bool({"user_image_url", "garment_image_url"} - columns)
    except Exception:
        return False


def _rebuild_sqlite_schema() -> bool:
    """Drop + recreate all tables in SQLite (dev convenience)."""
    if db_type != "sqlite":
        return False
    logger.warning("Rebuilding SQLite schema …")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    logger.info("SQLite schema rebuilt successfully")
    return True


# ---------------------------------------------------------------------------
# Initialisation (called at startup)
# ---------------------------------------------------------------------------
def initialize_database() -> bool:
    """Create / migrate database tables. Call during app startup."""
    global _db_healthy
    if not engine:
        logger.error("Cannot initialise DB — engine not created")
        return False
    try:
        if _schema_needs_rebuild():
            _rebuild_sqlite_schema()
        else:
            Base.metadata.create_all(bind=engine)
        _db_healthy = True
        logger.info("Database tables ready (%s)", db_type)
        return True
    except Exception as exc:
        logger.error("Table creation failed: %s", exc)
        _db_healthy = False
        return False


def check_db_health() -> bool:
    """Lightweight ping used by the /health endpoint."""
    if not engine or not _db_healthy:
        return False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db():
    """Yield a SQLAlchemy session; closes it when the request ends."""
    if not SessionLocal:
        raise RuntimeError("Database not initialised")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
