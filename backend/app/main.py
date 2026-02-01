from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging
from pathlib import Path
import asyncio

from app.config import settings
from app.database import create_database_engine, initialize_database, check_db_health
from app import database as db_module
from app.routers import tryon
from app.middleware.logging import LoggingMiddleware, SessionStateLoggingMiddleware
from app.services.cleanup import cleanup_expired_sessions

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('tryon_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize database engine (but don't create tables yet)
logger.info("="*60)
logger.info("TryOnAI Backend - Database Initialization")
logger.info("="*60)
create_database_engine()

# Create upload directories
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
logger.info(f"Upload directory ready: {settings.upload_dir}")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="TryOnAI API",
    description="Production-grade backend for AI Virtual Try-On",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add CORS middleware
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

# Add custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(SessionStateLoggingMiddleware)

# Mount static files for uploads
# This allows FastAPI to serve files from the uploads/ directory as static files
# so that URLs like /uploads/outputs/<session_id>_output.jpg can be accessed directly
# The directory path is resolved relative to the current working directory where uvicorn runs
upload_path = Path(settings.upload_dir).resolve()
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

# Include routers
app.include_router(tryon.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize database and start background tasks"""
    logger.info("="*60)
    logger.info("Starting TryOnAI API...")
    logger.info("="*60)
    
    # Initialize database tables
    if not initialize_database():
        logger.warning("WARNING: Database initialization had issues, but API will continue")
    
    # Start cleanup task
    asyncio.create_task(cleanup_expired_sessions())
    logger.info("Background cleanup task started")
    logger.info("="*60)
    logger.info(f"TryOnAI API ready on http://{settings.host}:{settings.port}")
    logger.info(f"API Docs: http://{settings.host}:{settings.port}/api/docs")
    logger.info(f"Database: {db_module.db_type.upper() if db_module.db_type else 'NOT_INITIALIZED'}")
    logger.info("="*60)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "TryOnAI API",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check with database status"""
    db_healthy = check_db_health()
    
    return {
        "status": "healthy" if db_healthy else "degraded",
        "database": {
            "type": db_module.db_type or "not_initialized",
            "connected": db_healthy,
            "status": "connected" if db_healthy else "disconnected",
            "warning": "Using SQLite - not for production" if db_module.db_type == "sqlite" else None
        },
        "storage": "available",
        "version": "1.0.0"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error occurred"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
