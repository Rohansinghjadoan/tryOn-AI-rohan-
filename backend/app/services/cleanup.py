import asyncio
from datetime import datetime
from app.database import SessionLocal
from app.crud import get_expired_sessions, delete_session
from app.services.storage import storage_service
from app.config import settings
import logging

logger = logging.getLogger(__name__)


async def cleanup_expired_sessions():
    """Background task to clean up expired sessions"""
    while True:
        try:
            # Check if database is initialized
            if SessionLocal is None:
                logger.warning("Database not initialized, skipping cleanup")
                await asyncio.sleep(settings.cleanup_interval_hours * 3600)
                continue
            
            db = SessionLocal()
            
            # Get expired sessions
            expired = get_expired_sessions(db, limit=100)
            
            if expired:
                logger.info(f"Found {len(expired)} expired sessions to clean up")
                
                for session in expired:
                    # Delete associated files
                    storage_service.delete_session_files(
                        session.input_image_url,
                        session.output_image_url
                    )
                    
                    # Delete session from database
                    delete_session(db, session.id)
                    logger.info(f"Cleaned up expired session: {session.id}")
            
            db.close()
        
        except Exception as e:
            logger.error(f"Error in cleanup task: {str(e)}")
        
        # Wait before next cleanup cycle
        await asyncio.sleep(settings.cleanup_interval_hours * 3600)
