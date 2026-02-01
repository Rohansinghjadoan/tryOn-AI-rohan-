import asyncio
import random
import time
from sqlalchemy.orm import Session
from app.models import SessionStatus
from app.crud import update_session_status, get_session
from app.services.storage import storage_service
from app.config import settings
import app.database as db_module  # Import module, not SessionLocal directly
import logging
import uuid

logger = logging.getLogger(__name__)


class TryOnWorker:
    """Background worker for processing try-on sessions"""
    
    def process_session(self, session_id: uuid.UUID) -> None:
        """Process a single try-on session (mock AI) - SYNCHRONOUS wrapper"""
        logger.info(f"*** WORKER STARTED *** for session {session_id}")
        
        db = None
        try:
            logger.info(f"Creating DB session for worker...")
            # Get SessionLocal at runtime, not import time!
            if db_module.SessionLocal is None:
                logger.error(f"*** WORKER FAILED *** SessionLocal is None - database not initialized!")
                return
            
            db = db_module.SessionLocal()
            logger.info(f"DB session created successfully")
            
            # Get session
            logger.info(f"Fetching session {session_id} from database...")
            session = get_session(db, session_id)
            if not session:
                logger.error(f"*** WORKER FAILED *** Session {session_id} not found")
                return
            
            logger.info(f"Worker found session {session_id}, current status: {session.status}")
            
            # Update to processing
            logger.info(f"Updating session {session_id} to PROCESSING...")
            update_session_status(db, session_id, SessionStatus.PROCESSING)
            logger.info(f"Committing PROCESSING status to database...")
            db.commit()  # CRITICAL: Commit the status change
            logger.info(f"Session {session_id} status updated to PROCESSING and committed")
            
            # Simulate AI processing time (blocking sleep for sync function)
            logger.info(f"Worker sleeping for {settings.mock_ai_processing_seconds} seconds...")
            time.sleep(settings.mock_ai_processing_seconds)
            logger.info(f"Worker finished sleeping for session {session_id}")
            
            # Simulate random failures to show robustness
            will_fail = random.random() < settings.mock_ai_failure_rate
            logger.info(f"Failure check: will_fail={will_fail}, threshold={settings.mock_ai_failure_rate}")
            
            if will_fail:
                # Failed processing
                error_reasons = [
                    "Unable to detect person in image",
                    "Image quality too low",
                    "Processing timeout",
                    "Invalid pose detected"
                ]
                error = random.choice(error_reasons)
                
                logger.info(f"Simulating failure for session {session_id}: {error}")
                update_session_status(
                    db,
                    session_id,
                    SessionStatus.FAILED,
                    error_reason=error
                )
                db.commit()  # CRITICAL: Commit the failure
                logger.warning(f"*** WORKER FAILED *** Session {session_id} - {error}")
            
            else:
                # Successful processing - generate mock output
                logger.info(f"Processing session {session_id}:")
                logger.info(f"  - User image: {session.user_image_url}")
                logger.info(f"  - Garment image: {session.garment_image_url}")
                logger.info(f"Generating output image...")
                
                output_url = storage_service.save_output_image(
                    session_id,
                    source_path=session.user_image_url  # Use user image as base for mock
                )
                logger.info(f"Output image saved: {output_url}")
                
                logger.info(f"Updating session {session_id} to COMPLETED...")
                update_session_status(
                    db,
                    session_id,
                    SessionStatus.COMPLETED,
                    output_image_url=output_url
                )
                logger.info(f"Committing COMPLETED status to database...")
                db.commit()  # CRITICAL: Commit the completion
                logger.info(f"*** WORKER COMPLETED *** Session {session_id} completed successfully")
        
        except Exception as e:
            logger.error(f"*** WORKER FAILED *** Error processing session {session_id}: {str(e)}")
            logger.exception(e)  # Log full stack trace
            try:
                if db:
                    update_session_status(
                        db,
                        session_id,
                        SessionStatus.FAILED,
                        error_reason=f"Internal processing error: {str(e)}"
                    )
                    db.commit()  # CRITICAL: Commit the error status
            except Exception as commit_error:
                logger.error(f"Failed to update error status: {commit_error}")
        
        finally:
            if db:
                db.close()
                logger.info(f"Worker finished for session {session_id}, DB connection closed")


# Singleton worker instance
worker = TryOnWorker()
