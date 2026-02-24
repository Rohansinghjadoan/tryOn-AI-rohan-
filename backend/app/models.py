"""SQLAlchemy ORM models."""

import enum
import uuid
from datetime import datetime, timedelta

from sqlalchemy import Column, DateTime, Enum, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID

from app.config import settings
from app.database import Base


class SessionStatus(str, enum.Enum):
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TryOnSession(Base):
    __tablename__ = "tryon_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_token = Column(String(255), nullable=False, index=True)

    # Image URLs (relative, e.g. /uploads/users/<uuid>_user.jpg)
    user_image_url = Column(Text, nullable=False)
    garment_image_url = Column(Text, nullable=False)
    output_image_url = Column(Text, nullable=True)

    # Garment category: upper_body, lower_body, dresses
    garment_category = Column(String(20), default="upper_body", nullable=False)

    status = Column(Enum(SessionStatus), default=SessionStatus.CREATED, nullable=False, index=True)
    error_reason = Column(Text, nullable=True)

    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_status_created", "status", "created_at"),
        Index("idx_expires_status", "expires_at", "status"),
    )

    # Backward-compat alias
    @property
    def input_image_url(self) -> str:
        return self.user_image_url

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(hours=settings.session_expiry_hours)
