"""Pydantic schemas for request / response validation."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models import SessionStatus


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------
class TryOnSessionCreate(BaseModel):
    user_token: str = Field(..., min_length=1, max_length=255)


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------
class UploadResponse(BaseModel):
    session_id: UUID
    status: str
    message: str


class SessionStatusResponse(BaseModel):
    id: UUID
    status: SessionStatus
    output_image_url: Optional[str] = None
    error_reason: Optional[str] = None
    progress_message: Optional[str] = None

    class Config:
        from_attributes = True


class SessionDetailResponse(BaseModel):
    id: UUID
    user_token: str
    status: SessionStatus
    user_image_url: Optional[str] = None
    garment_image_url: Optional[str] = None
    output_image_url: Optional[str] = None
    error_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
