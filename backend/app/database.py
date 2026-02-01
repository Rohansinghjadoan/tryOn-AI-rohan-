from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import logging
from typing import Tuple, Set

from app.config import settings

logger = logging.getLogger(__name__)

# Base class for models (needed before engine creation)
Base = declarative_base()

# Global variables for engine and session
engine = None
SessionLocal = None
db_type = None  # 'postgresql' or 'sqlite'
db_connection_healthy = False


def create_database_engine() -> Tuple[bool, str]:
    """
    Create database engine with fallback to SQLite.
    Returns: (success, db_type)
    """
    global engine, SessionLocal, db_type, db_connection_healthy
    
    # Try PostgreSQL first
    try:
        logger.info(f"Attempting PostgreSQL connection: {settings.database_url.split('@')[1] if '@' in settings.database_url else settings.database_url}")
        
        # Create engine with connection pool settings for PostgreSQL
        temp_engine = create_engine(
            settings.database_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 5}  # 5 second timeout
        )
        
        # Test connection
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        # Success!
        engine = temp_engine
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db_type = 'postgresql'
        db_connection_healthy = True
        
        logger.info("PostgreSQL connection successful")
        return True, 'postgresql'
        
    except Exception as e:
        logger.error("PostgreSQL connection failed")
        logger.error(f"   Error: {str(e)}")
        logger.error(f"   DATABASE_URL: {settings.database_url}")
        logger.warning("")
        logger.warning("How to fix:")
        logger.warning("   1. Ensure PostgreSQL is running: 'pg_ctl status' or check Windows Services")
        logger.warning("   2. Verify credentials in .env or DATABASE_URL")
        logger.warning("   3. Check connection string format:")
        logger.warning("      postgresql://username:password@localhost:5432/database_name")
        logger.warning("   4. For Windows, default user is usually 'postgres'")
        logger.warning("   5. You may need to create the database first:")
        logger.warning("      psql -U postgres -c 'CREATE DATABASE tryonai;'")
        logger.warning("")
        
        # Fallback to SQLite
        logger.warning("Falling back to SQLite for local development...")
        
        try:
            sqlite_url = "sqlite:///./dev.db"
            engine = create_engine(
                sqlite_url,
                connect_args={"check_same_thread": False}  # Required for SQLite
            )
            
            # Test SQLite connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db_type = 'sqlite'
            db_connection_healthy = True
            
            logger.warning("WARNING: SQLite enabled - DEVELOPMENT ONLY")
            logger.warning("   Database file: ./dev.db")
            logger.warning("   This is NOT suitable for production!")
            logger.warning("   Fix PostgreSQL connection for production use.")
            logger.warning("")
            
            return False, 'sqlite'
            
        except Exception as sqlite_error:
            logger.critical(f"❌ SQLite fallback also failed: {sqlite_error}")
            logger.critical("Cannot start application without database!")
            db_connection_healthy = False
            raise RuntimeError("Database initialization failed") from sqlite_error


def check_schema_mismatch() -> bool:
    """
    Check if database schema matches SQLAlchemy models.
    Returns True if mismatch detected (needs recreation).
    Only checks SQLite databases.
    """
    global engine, db_type
    
    if not engine or db_type != 'sqlite':
        return False
    
    try:
        inspector = inspect(engine)
        
        # Check if tryon_sessions table exists
        if 'tryon_sessions' not in inspector.get_table_names():
            logger.info("Schema check: tryon_sessions table not found (first run)")
            return False
        
        # Get actual columns in database
        actual_columns = {col['name'] for col in inspector.get_columns('tryon_sessions')}
        
        # Expected columns from new model
        expected_columns = {'user_image_url', 'garment_image_url'}
        
        # Old column that should NOT exist
        old_columns = {'input_image_url'}
        
        # Check for schema mismatch
        has_old_schema = old_columns.intersection(actual_columns)
        missing_new_columns = expected_columns - actual_columns
        
        if has_old_schema or missing_new_columns:
            logger.warning("=" * 70)
            logger.warning("SCHEMA MISMATCH DETECTED")
            logger.warning("=" * 70)
            if has_old_schema:
                logger.warning(f"   Found old columns: {has_old_schema}")
            if missing_new_columns:
                logger.warning(f"   Missing new columns: {missing_new_columns}")
            logger.warning(f"   Current columns: {actual_columns}")
            logger.warning("=" * 70)
            return True
        
        logger.info("Schema validation passed - database matches model")
        return False
        
    except Exception as e:
        logger.error(f"Error checking schema: {e}")
        return False


def recreate_sqlite_schema():
    """
    Drop and recreate all tables in SQLite database.
    This is ONLY called for SQLite in development.
    """
    global engine, db_type
    
    if db_type != 'sqlite':
        logger.error("Attempted to recreate schema on non-SQLite database - BLOCKED!")
        return False
    
    try:
        logger.warning("Recreating SQLite schema...")
        logger.warning("   - Dropping all tables")
        
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        
        logger.warning("   - Creating fresh tables with new schema")
        
        # Recreate with new schema
        Base.metadata.create_all(bind=engine)
        
        logger.warning("Schema recreation complete")
        logger.warning("   - user_image_url: OK")
        logger.warning("   - garment_image_url: OK")
        logger.warning("=" * 70)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to recreate schema: {e}")
        return False


def initialize_database():
    """
    Initialize database tables.
    For SQLite: Checks schema and recreates if mismatch detected.
    For PostgreSQL: Normal create_all (idempotent).
    Should be called during startup event, not on import.
    """
    global db_connection_healthy
    
    if not engine:
        logger.error("Cannot initialize database: engine not created")
        return False
    
    try:
        # Check for schema mismatch (SQLite only)
        if db_type == 'sqlite' and check_schema_mismatch():
            logger.warning("Resolution: Auto-recreating SQLite schema (dev mode)")
            if not recreate_sqlite_schema():
                logger.error("Failed to fix schema mismatch")
                db_connection_healthy = False
                return False
        else:
            # Normal initialization
            logger.info("Creating database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info(f"Database tables initialized ({db_type})")
        
        db_connection_healthy = True
        return True
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        db_connection_healthy = False
        return False


def check_db_health() -> bool:
    """
    Check if database connection is healthy.
    """
    if not engine or not db_connection_healthy:
        return False
    
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except:
        return False


# Dependency to get DB session
def get_db():
    """FastAPI dependency for database sessions"""
    if not SessionLocal:
        raise RuntimeError("Database not initialized")
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
