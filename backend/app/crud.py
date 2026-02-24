"""CRUD helpers for TryOnSession."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models import SessionStatus, TryOnSession


def create_session(
    db: Session,
    *,
    user_token: str,
    user_image_url: str,
    garment_image_url: str,
) -> TryOnSession:
    row = TryOnSession(
        user_token=user_token,
        user_image_url=user_image_url,
        garment_image_url=garment_image_url,
        status=SessionStatus.CREATED,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_session(db: Session, session_id: uuid.UUID) -> Optional[TryOnSession]:
    return db.query(TryOnSession).filter(TryOnSession.id == session_id).first()


def get_sessions_by_user(db: Session, user_token: str, limit: int = 10) -> List[TryOnSession]:
    return (
        db.query(TryOnSession)
        .filter(TryOnSession.user_token == user_token)
        .order_by(TryOnSession.created_at.desc())
        .limit(limit)
        .all()
    )


def update_session_status(
    db: Session,
    session_id: uuid.UUID,
    status: SessionStatus,
    *,
    output_image_url: Optional[str] = None,
    error_reason: Optional[str] = None,
) -> Optional[TryOnSession]:
    row = get_session(db, session_id)
    if not row:
        return None
    row.status = status
    if output_image_url:
        row.output_image_url = output_image_url
    if error_reason:
        row.error_reason = error_reason
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row


def get_expired_sessions(db: Session, limit: int = 100) -> List[TryOnSession]:
    return (
        db.query(TryOnSession)
        .filter(TryOnSession.expires_at < datetime.utcnow())
        .limit(limit)
        .all()
    )


def delete_session(db: Session, session_id: uuid.UUID) -> bool:
    row = get_session(db, session_id)
    if not row:
        return False
    db.delete(row)
    db.commit()
    return True


def get_pending_sessions(db: Session, limit: int = 50) -> List[TryOnSession]:
    return (
        db.query(TryOnSession)
        .filter(TryOnSession.status == SessionStatus.CREATED)
        .order_by(TryOnSession.created_at.asc())
        .limit(limit)
        .all()
    )
