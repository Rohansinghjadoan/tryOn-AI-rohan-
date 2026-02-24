"""
Background worker — picks up CREATED sessions and runs mock AI processing.

Replace the mock sleep + random-failure logic with a real AI model call
when ready. No other code changes required.
"""

from __future__ import annotations

import logging
import random
import time
import uuid

import app.database as db_module
from app.config import settings
from app.crud import get_session, update_session_status
from app.models import SessionStatus
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

_MOCK_ERRORS = [
    "Unable to detect person in image",
    "Image quality too low",
    "Processing timeout",
    "Invalid pose detected",
]


class TryOnWorker:
    """Synchronous session processor invoked as a FastAPI BackgroundTask."""

    def process_session(self, session_id: uuid.UUID) -> None:
        if db_module.SessionLocal is None:
            logger.error("Worker: database not initialised — skipping session %s", session_id)
            return

        db = db_module.SessionLocal()
        try:
            session = get_session(db, session_id)
            if not session:
                logger.error("Worker: session %s not found", session_id)
                return

            # Mark as processing
            update_session_status(db, session_id, SessionStatus.PROCESSING)

            # ── Mock AI processing (replace this block with real model) ──
            time.sleep(settings.mock_ai_processing_seconds)

            if random.random() < settings.mock_ai_failure_rate:
                error = random.choice(_MOCK_ERRORS)
                update_session_status(db, session_id, SessionStatus.FAILED, error_reason=error)
                logger.warning("Session %s failed (mock): %s", session_id, error)
                return
            # ── End mock ──────────────────────────────────────────────────

            output_url = storage_service.save_output_image(session_id, source_path=session.user_image_url)
            update_session_status(db, session_id, SessionStatus.COMPLETED, output_image_url=output_url)
            logger.info("Session %s completed", session_id)

        except Exception as exc:
            logger.error("Worker error for session %s: %s", session_id, exc, exc_info=True)
            try:
                update_session_status(db, session_id, SessionStatus.FAILED, error_reason=str(exc))
            except Exception:
                pass
        finally:
            db.close()


worker = TryOnWorker()
