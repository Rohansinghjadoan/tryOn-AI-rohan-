import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException
from PIL import Image
import uuid
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.user_dir = self.upload_dir / "users"
        self.garment_dir = self.upload_dir / "garments"
        self.output_dir = self.upload_dir / "outputs"
        
        # Create directories if they don't exist
        self.user_dir.mkdir(parents=True, exist_ok=True)
        self.garment_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def validate_image(self, file: UploadFile) -> None:
        """Validate uploaded image file"""
        # Check file extension
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        ext = file.filename.split('.')[-1].lower()
        if ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions)}"
            )
        
        # Check file size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to start
        
        max_size = settings.max_file_size_mb * 1024 * 1024
        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {settings.max_file_size_mb}MB"
            )

    async def save_user_image(self, file: UploadFile, session_id: uuid.UUID) -> str:
        """Save uploaded user photo"""
        self.validate_image(file)
        
        # Generate unique filename
        ext = file.filename.split('.')[-1].lower()
        filename = f"{session_id}_user.{ext}"
        file_path = self.user_dir / filename
        
        try:
            # Save file
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Verify it's a valid image
            with Image.open(file_path) as img:
                img.verify()
            
            # Return relative URL
            return f"/uploads/users/{filename}"
        
        except Exception as e:
            # Clean up on error
            if file_path.exists():
                file_path.unlink()
            logger.error(f"Error saving user image: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing user image")

    async def save_garment_image(self, file: UploadFile, session_id: uuid.UUID) -> str:
        """Save uploaded garment image"""
        self.validate_image(file)
        
        # Generate unique filename
        ext = file.filename.split('.')[-1].lower()
        filename = f"{session_id}_garment.{ext}"
        file_path = self.garment_dir / filename
        
        try:
            # Save file
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Verify it's a valid image
            with Image.open(file_path) as img:
                img.verify()
            
            # Return relative URL
            return f"/uploads/garments/{filename}"
        
        except Exception as e:
            # Clean up on error
            if file_path.exists():
                file_path.unlink()
            logger.error(f"Error saving garment image: {str(e)}")
            raise HTTPException(status_code=500, detail="Error processing garment image")

    def save_output_image(self, session_id: uuid.UUID, source_path: Optional[str] = None) -> str:
        """Save or generate output image (mock for now)"""
        # For mock: copy input as output or use placeholder
        filename = f"{session_id}_output.jpg"
        file_path = self.output_dir / filename
        
        if source_path:
            # Copy source as output (mock)
            # source_path is a URL like "/uploads/inputs/file.jpg"
            # We need to extract just the "inputs/file.jpg" part
            path_parts = source_path.lstrip('/').split('/', 1)  # Split "uploads/inputs/file.jpg"
            if len(path_parts) > 1:
                relative_path = path_parts[1]  # Get "inputs/file.jpg"
                input_path = self.upload_dir / relative_path
            else:
                input_path = self.upload_dir / source_path.lstrip('/')
            
            if input_path.exists():
                shutil.copy2(input_path, file_path)
                logger.info(f"Copied input {input_path} to output {file_path}")
            else:
                logger.warning(f"Input file not found at {input_path}, creating placeholder")
                # Create a placeholder image if source doesn't exist
                img = Image.new('RGB', (512, 512), color='lightgray')
                img.save(file_path)
        else:
            # Create a placeholder image
            img = Image.new('RGB', (512, 512), color='lightgray')
            img.save(file_path)
        
        logger.info(f"Output image saved to disk: {file_path}")
        return f"/uploads/outputs/{filename}"

    def delete_session_files(self, input_url: Optional[str], output_url: Optional[str]) -> None:
        """Delete files associated with a session"""
        try:
            if input_url:
                input_path = self.upload_dir / input_url.lstrip('/')
                if input_path.exists():
                    input_path.unlink()
                    logger.info(f"Deleted input file: {input_path}")
            
            if output_url:
                output_path = self.upload_dir / output_url.lstrip('/')
                if output_path.exists():
                    output_path.unlink()
                    logger.info(f"Deleted output file: {output_path}")
        
        except Exception as e:
            logger.error(f"Error deleting files: {str(e)}")

    def get_file_path(self, url: str) -> Path:
        """Convert URL to file path"""
        return self.upload_dir / url.lstrip('/')


# Singleton instance
storage_service = StorageService()
