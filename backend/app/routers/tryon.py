"""Try-on session API endpoints."""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.crud import create_session, get_session
from app.database import get_db
from app.models import SessionStatus
from app.schemas import SessionDetailResponse, SessionStatusResponse, UploadResponse
from app.services.storage import storage_service
from app.services.worker import worker

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tryon", tags=["try-on"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
PROGRESS_MESSAGES = {
    SessionStatus.CREATED: "Session created, queued for processing…",
    SessionStatus.PROCESSING: "AI model is generating your try-on — this takes 1–2 minutes…",
    SessionStatus.COMPLETED: "Try-on completed successfully!",
    SessionStatus.FAILED: "Processing failed. Please try again.",
}


def _absolute_url(request: Request, relative: str | None) -> str | None:
    """Convert a relative upload path to an absolute URL."""
    if not relative or relative.startswith(("http://", "https://")):
        return relative
    base = str(request.base_url).rstrip("/")
    if base.endswith("/api"):
        base = base[:-4]
    return f"{base}{relative}"


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/sessions", response_model=UploadResponse, status_code=201)
async def create_tryon_session(
    background_tasks: BackgroundTasks,
    user_image: UploadFile = File(..., description="User photo"),
    garment_image: UploadFile = File(..., description="Garment image"),
    user_token: str = Form(..., description="Anonymous user identifier"),
    category: str = Form("upper_body", description="Garment category: upper_body, lower_body, dresses"),
    db: Session = Depends(get_db),
):
    """Upload two images and start an async try-on session."""
    # Validate category
    valid_categories = {"upper_body", "lower_body", "dresses"}
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}")

    try:
        session = create_session(
            db,
            user_token=user_token,
            user_image_url="pending",
            garment_image_url="pending",
            garment_category=category,
        )

        user_url = await storage_service.save_user_image(user_image, session.id)
        garment_url = await storage_service.save_garment_image(garment_image, session.id)

        session.user_image_url = user_url
        session.garment_image_url = garment_url
        db.commit()
        db.refresh(session)

        background_tasks.add_task(worker.process_session, session.id)
        logger.info("Session %s created for user %s", session.id, user_token)

        return UploadResponse(
            session_id=session.id,
            status="created",
            message="Session created. Processing started.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Error creating session: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions/{session_id}", response_model=SessionStatusResponse)
async def get_session_status(
    session_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
):
    """Poll the current status of a try-on session."""
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionStatusResponse(
        id=session.id,
        status=session.status,
        output_image_url=_absolute_url(request, session.output_image_url),
        error_reason=session.error_reason,
        progress_message=PROGRESS_MESSAGES.get(session.status),
    )


@router.get("/sessions/{session_id}/details", response_model=SessionDetailResponse)
async def get_session_details(
    session_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
):
    """Full session details (admin / debugging)."""
    session = get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    resp = SessionDetailResponse.model_validate(session)
    resp.user_image_url = _absolute_url(request, session.user_image_url)
    resp.garment_image_url = _absolute_url(request, session.garment_image_url)
    resp.output_image_url = _absolute_url(request, session.output_image_url)
    return resp
