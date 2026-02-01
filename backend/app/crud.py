from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models import TryOnSession, SessionStatus
from datetime import datetime
from typing import Optional, List
import uuid


def create_session(
    db: Session,
    user_token: str,
    user_image_url: str,
    garment_image_url: str
) -> TryOnSession:
    """Create a new try-on session"""
    db_session = TryOnSession(
        user_token=user_token,
        user_image_url=user_image_url,
        garment_image_url=garment_image_url,
        status=SessionStatus.CREATED
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_session(db: Session, session_id: uuid.UUID) -> Optional[TryOnSession]:
    """Get a session by ID"""
    return db.query(TryOnSession).filter(TryOnSession.id == session_id).first()


def get_session_by_user(
    db: Session,
    user_token: str,
    limit: int = 10
) -> List[TryOnSession]:
    """Get sessions for a user"""
    return db.query(TryOnSession)\
        .filter(TryOnSession.user_token == user_token)\
        .order_by(TryOnSession.created_at.desc())\
        .limit(limit)\
        .all()


def update_session_status(
    db: Session,
    session_id: uuid.UUID,
    status: SessionStatus,
    output_image_url: Optional[str] = None,
    error_reason: Optional[str] = None
) -> Optional[TryOnSession]:
    """Update session status"""
    db_session = get_session(db, session_id)
    if db_session:
        db_session.status = status
        if output_image_url:
            db_session.output_image_url = output_image_url
        if error_reason:
            db_session.error_reason = error_reason
        db_session.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_session)
    return db_session


def get_expired_sessions(db: Session, limit: int = 100) -> List[TryOnSession]:
    """Get expired sessions for cleanup"""
    return db.query(TryOnSession)\
        .filter(TryOnSession.expires_at < datetime.utcnow())\
        .limit(limit)\
        .all()


def delete_session(db: Session, session_id: uuid.UUID) -> bool:
    """Delete a session"""
    db_session = get_session(db, session_id)
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False


def get_pending_sessions(db: Session, limit: int = 50) -> List[TryOnSession]:
    """Get sessions waiting for processing"""
    return db.query(TryOnSession)\
        .filter(TryOnSession.status == SessionStatus.CREATED)\
        .order_by(TryOnSession.created_at.asc())\
        .limit(limit)\
        .all()
