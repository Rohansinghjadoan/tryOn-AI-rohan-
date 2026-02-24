"""Periodic cleanup of expired sessions and their files."""

from __future__ import annotations

import asyncio
import logging

from app.config import settings
from app.crud import delete_session, get_expired_sessions
from app.database import SessionLocal
from app.services.storage import storage_service

logger = logging.getLogger(__name__)


async def cleanup_expired_sessions() -> None:
    """Long-running background coroutine — deletes expired sessions hourly."""
    interval = settings.cleanup_interval_hours * 3600

    while True:
        try:
            if SessionLocal is None:
                logger.warning("Cleanup: database not ready, skipping cycle")
                await asyncio.sleep(interval)
                continue

            db = SessionLocal()
            try:
                expired = get_expired_sessions(db, limit=100)
                if expired:
                    logger.info("Cleaning up %d expired session(s)", len(expired))
                for s in expired:
                    storage_service.delete_session_files(
                        s.user_image_url, s.garment_image_url, s.output_image_url
                    )
                    delete_session(db, s.id)
            finally:
                db.close()

        except Exception as exc:
            logger.error("Cleanup error: %s", exc, exc_info=True)

        await asyncio.sleep(interval)
