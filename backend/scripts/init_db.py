#!/usr/bin/env python3
"""Bootstrap script — create database tables outside of the running app."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import Base, create_database_engine, initialize_database  # noqa: E402
from app.models import TryOnSession  # noqa: E402, F401 — registers the model

if __name__ == "__main__":
    create_database_engine()
    initialize_database()
    print("Database tables ready.")
