#!/usr/bin/env python3
"""
Initialize the database with tables
Run this script to set up the database
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base
from app.models import TryOnSession
from app.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_db():
    """Create all database tables"""
    logger.info("Creating database tables...")
    logger.info(f"Database URL: {settings.database_url}")
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully!")
        
        # Print created tables
        logger.info("Created tables:")
        for table in Base.metadata.sorted_tables:
            logger.info(f"  - {table.name}")
    
    except Exception as e:
        logger.error(f"❌ Error creating tables: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    init_db()
