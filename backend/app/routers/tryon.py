from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    TryOnSessionCreate,
    TryOnSessionResponse,
    TryOnSessionStatusResponse,
    UploadResponse
)
from app.crud import create_session, get_session, update_session_status
from app.services.storage import storage_service
from app.services.worker import worker
from app.models import SessionStatus
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tryon", tags=["try-on"])


def build_absolute_url(request: Request, relative_url: str | None) -> str | None:
    """
    Convert relative URL to absolute URL using request's base URL.
    
    Example:
      Input:  /uploads/outputs/abc.jpg
      Output: https://my-backend.onrender.com/uploads/outputs/abc.jpg
    
    Note: Removes /api prefix from base_url since static files are mounted at root
    """
    if not relative_url:
        return None
    
    # If already absolute URL, return as-is
    if relative_url.startswith(('http://', 'https://')):
        return relative_url
    
    # Get base URL from request (e.g., "https://my-backend.onrender.com/api/")
    base_url = str(request.base_url).rstrip('/')
    
    # Remove /api suffix if present (static files are mounted at root /uploads)
    # request.base_url for /api/tryon/sessions would be: https://domain.com/api/
    if base_url.endswith('/api'):
        base_url = base_url[:-4]  # Remove last 4 characters (/api)
    
    # Combine base URL with relative path
    return f"{base_url}{relative_url}"


@router.post("/sessions", response_model=UploadResponse, status_code=201)
async def create_tryon_session(
    background_tasks: BackgroundTasks,
    user_image: UploadFile = File(..., description="User photo (customer)"),
    garment_image: UploadFile = File(..., description="Garment image (product catalog)"),
    user_token: str = Form(..., description="Anonymous user identifier"),
    db: Session = Depends(get_db)
):
    """
    Create a new try-on session
    
    - Validates and stores user photo and garment image
    - Creates session record
    - Triggers async processing
    - Returns session_id immediately
    """
    try:
        # Create session first to get ID
        temp_session = create_session(
            db=db,
            user_token=user_token,
            user_image_url="pending",
            garment_image_url="pending"
        )
        
        # Save both images with session ID
        user_url = await storage_service.save_user_image(user_image, temp_session.id)
        garment_url = await storage_service.save_garment_image(garment_image, temp_session.id)
        
        # Update session with actual image URLs
        temp_session.user_image_url = user_url
        temp_session.garment_image_url = garment_url
        db.commit()
        db.refresh(temp_session)
        
        # Trigger background processing
        background_tasks.add_task(worker.process_session, temp_session.id)
        
        logger.info(f"Created session {temp_session.id} for user {user_token} (user: {user_url}, garment: {garment_url})")
        
        return UploadResponse(
            session_id=temp_session.id,
            status="created",
            message="Session created successfully. Processing started."
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating session: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions/{session_id}", response_model=TryOnSessionStatusResponse)
async def get_session_status(
    session_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get status of a try-on session
    
    - Returns current status
    - Includes output image URL if completed
    - Includes error message if failed
    """
    session = get_session(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Build progress message based on status
    progress_messages = {
        SessionStatus.CREATED: "Session created, waiting for processing...",
        SessionStatus.PROCESSING: "AI is processing your try-on...",
        SessionStatus.COMPLETED: "Try-on completed successfully!",
        SessionStatus.FAILED: "Processing failed. Please try again."
    }
    
    # Convert relative URLs to absolute URLs
    output_image_url = build_absolute_url(request, session.output_image_url)
    
    return TryOnSessionStatusResponse(
        id=session.id,
        status=session.status,
        output_image_url=output_image_url,
        error_reason=session.error_reason,
        progress_message=progress_messages.get(session.status)
    )


@router.get("/sessions/{session_id}/details", response_model=TryOnSessionResponse)
async def get_session_details(
    session_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db)
):
    """Get full details of a session (for debugging/admin)"""
    session = get_session(db, session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Convert relative URLs to absolute URLs
    response_data = TryOnSessionResponse.model_validate(session)
    response_data.user_image_url = build_absolute_url(request, session.user_image_url)
    response_data.garment_image_url = build_absolute_url(request, session.garment_image_url)
    response_data.output_image_url = build_absolute_url(request, session.output_image_url)
    
    return response_data
