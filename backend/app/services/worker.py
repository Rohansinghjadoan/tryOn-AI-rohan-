"""
Background worker — processes try-on sessions using the Change-Clothes-AI
HuggingFace Space via gradio_client.
"""

from __future__ import annotations

import logging
import uuid

from gradio_client import Client, handle_file

import app.database as db_module
from app.config import settings
from app.crud import get_session, update_session_status
from app.models import SessionStatus
from app.services.storage import storage_service

logger = logging.getLogger(__name__)


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

            update_session_status(db, session_id, SessionStatus.PROCESSING)

            # Resolve absolute file paths from relative upload URLs
            user_img_path = str(storage_service.get_absolute_path(session.user_image_url))
            garment_img_path = str(storage_service.get_absolute_path(session.garment_image_url))
            category = getattr(session, "garment_category", "upper_body") or "upper_body"

            logger.info(
                "Session %s: calling HF Space '%s' (category=%s)",
                session_id, settings.hf_space, category,
            )

            # Call the Change-Clothes-AI Gradio API
            client = Client(settings.hf_space)
            result = client.predict(
                dict={"background": handle_file(user_img_path), "layers": [], "composite": None},
                garm_img=handle_file(garment_img_path),
                garment_des="",
                is_checked=True,
                is_checked_crop=False,
                denoise_steps=30,
                seed=-1,
                category=category,
                api_name="/tryon",
            )

            # result is a tuple: (output_image_path, masked_image_path)
            output_file = result[0] if isinstance(result, (tuple, list)) else result
            logger.info("Session %s: AI returned output at %s", session_id, output_file)

            output_url = storage_service.save_output_from_file(session_id, output_file)
            update_session_status(db, session_id, SessionStatus.COMPLETED, output_image_url=output_url)
            logger.info("Session %s completed successfully", session_id)

        except Exception as exc:
            logger.error("Worker error for session %s: %s", session_id, exc, exc_info=True)
            try:
                update_session_status(db, session_id, SessionStatus.FAILED, error_reason=str(exc))
            except Exception:
                pass
        finally:
            db.close()


worker = TryOnWorker()
