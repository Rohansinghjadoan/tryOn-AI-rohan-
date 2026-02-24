"""File storage service — validates, saves, and deletes uploaded images."""

from __future__ import annotations

import logging
import shutil
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """Manages image files on the local filesystem."""

    def __init__(self) -> None:
        self.upload_dir = Path(settings.upload_dir)
        self.user_dir = self.upload_dir / "users"
        self.garment_dir = self.upload_dir / "garments"
        self.output_dir = self.upload_dir / "outputs"

        for d in (self.user_dir, self.garment_dir, self.output_dir):
            d.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------
    def _validate(self, file: UploadFile) -> str:
        """Validate an uploaded file and return its extension."""
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")

        ext = file.filename.rsplit(".", 1)[-1].lower()
        if ext not in settings.allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions)}",
            )

        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        if size > settings.max_file_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max: {settings.max_file_size_mb} MB",
            )
        return ext

    # ------------------------------------------------------------------
    # Save helpers
    # ------------------------------------------------------------------
    async def _save(self, file: UploadFile, directory: Path, session_id: uuid.UUID, tag: str) -> str:
        ext = self._validate(file)
        filename = f"{session_id}_{tag}.{ext}"
        path = directory / filename

        try:
            with path.open("wb") as buf:
                shutil.copyfileobj(file.file, buf)
            with Image.open(path) as img:
                img.verify()
            return f"/uploads/{directory.name}/{filename}"
        except Exception as exc:
            path.unlink(missing_ok=True)
            logger.error("Failed to save %s image: %s", tag, exc)
            raise HTTPException(status_code=500, detail=f"Error processing {tag} image")

    async def save_user_image(self, file: UploadFile, session_id: uuid.UUID) -> str:
        return await self._save(file, self.user_dir, session_id, "user")

    async def save_garment_image(self, file: UploadFile, session_id: uuid.UUID) -> str:
        return await self._save(file, self.garment_dir, session_id, "garment")

    # ------------------------------------------------------------------
    # Output
    # ------------------------------------------------------------------
    def save_output_from_file(self, session_id: uuid.UUID, source_file_path: str) -> str:
        """Copy an AI-generated output image from a local temp path into storage."""
        src = Path(source_file_path)
        ext = src.suffix.lstrip(".") or "png"
        filename = f"{session_id}_output.{ext}"
        out_path = self.output_dir / filename
        shutil.copy2(src, out_path)
        logger.info("Saved output for session %s -> %s", session_id, out_path)
        return f"/uploads/outputs/{filename}"

    def get_absolute_path(self, relative_url: str) -> Path:
        """Resolve a relative /uploads/... URL to an absolute filesystem path."""
        rel = relative_url.lstrip("/")
        if rel.startswith("uploads/"):
            rel = rel[len("uploads/"):]
        return self.upload_dir / rel

    # ------------------------------------------------------------------
    # Cleanup
    # ------------------------------------------------------------------
    def delete_session_files(self, *urls: Optional[str]) -> None:
        for url in urls:
            if not url:
                continue
            rel = url.lstrip("/")
            if rel.startswith("uploads/"):
                rel = rel[len("uploads/"):]
            path = self.upload_dir / rel
            if path.exists():
                path.unlink()
                logger.info("Deleted %s", path)


storage_service = StorageService()
