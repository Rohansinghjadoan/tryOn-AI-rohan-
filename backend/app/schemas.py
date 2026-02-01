from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional
from app.models import SessionStatus


# Request schemas
class TryOnSessionCreate(BaseModel):
    user_token: str = Field(..., min_length=1, max_length=255, description="Anonymous user identifier")


# Response schemas
class TryOnSessionResponse(BaseModel):
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


class TryOnSessionStatusResponse(BaseModel):
    id: UUID
    status: SessionStatus
    output_image_url: Optional[str] = None
    error_reason: Optional[str] = None
    progress_message: Optional[str] = None

    class Config:
        from_attributes = True


# Upload response
class UploadResponse(BaseModel):
    session_id: UUID
    status: str
    message: str
