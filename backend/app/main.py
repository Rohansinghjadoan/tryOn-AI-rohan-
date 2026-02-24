"""
TryOnAI Backend — FastAPI Application Entry Point

Supports PostgreSQL (production) with automatic SQLite fallback (dev).
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app import database as db_module
from app.config import settings
from app.database import check_db_health, create_database_engine, initialize_database
from app.middleware.logging import LoggingMiddleware
from app.routers import tryon
from app.services.cleanup import cleanup_expired_sessions

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-28s  %(levelname)-8s  %(message)s",
    handlers=[
        logging.FileHandler("tryon_api.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Database engine (tables created in startup event)
# ---------------------------------------------------------------------------
create_database_engine()

# Upload directory
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="TryOnAI API",
    description="Production-grade backend for AI Virtual Try-On",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://try-on-ai-blue.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(LoggingMiddleware)

upload_path = Path(settings.upload_dir).resolve()
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

app.include_router(tryon.router, prefix="/api")


# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    initialize_database()
    asyncio.create_task(cleanup_expired_sessions())
    logger.info("=" * 60)
    logger.info("TryOnAI API ready — http://%s:%s", settings.host, settings.port)
    logger.info("Docs: http://%s:%s/api/docs", settings.host, settings.port)
    logger.info("Database: %s", (db_module.db_type or "NONE").upper())
    logger.info("=" * 60)


# ---------------------------------------------------------------------------
# Root / health
# ---------------------------------------------------------------------------
@app.get("/")
async def root():
    return {"service": "TryOnAI API", "status": "healthy", "version": "1.0.0"}


@app.get("/api/health")
async def health_check():
    healthy = check_db_health()
    return {
        "status": "healthy" if healthy else "degraded",
        "database": {
            "type": db_module.db_type or "not_initialised",
            "connected": healthy,
            "warning": "SQLite — dev only" if db_module.db_type == "sqlite" else None,
        },
        "version": "1.0.0",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})
