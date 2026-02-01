import enum
from sqlalchemy import Column, String, DateTime, Text, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timedelta
import uuid
from app.database import Base
from app.config import settings


class SessionStatus(str, enum.Enum):
    CREATED = "created"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class TryOnSession(Base):
    __tablename__ = "tryon_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_token = Column(String(255), nullable=False, index=True)
    user_image_url = Column(Text, nullable=False)  # Customer photo
    garment_image_url = Column(Text, nullable=False)  # Product catalog image
    output_image_url = Column(Text, nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.CREATED, nullable=False, index=True)
    error_reason = Column(Text, nullable=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Keep old input_image_url for backward compatibility (will be same as user_image_url)
    @property
    def input_image_url(self):
        return self.user_image_url

    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_status_created', 'status', 'created_at'),
        Index('idx_expires_at_status', 'expires_at', 'status'),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.expires_at:
            self.expires_at = datetime.utcnow() + timedelta(hours=settings.session_expiry_hours)
