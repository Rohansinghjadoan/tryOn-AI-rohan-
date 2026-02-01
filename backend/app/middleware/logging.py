import logging
import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request/response logging"""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Log request
        start_time = time.time()
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"- Client: {request.client.host if request.client else 'unknown'}"
        )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Log response
            process_time = time.time() - start_time
            logger.info(
                f"[{request_id}] Completed {response.status_code} "
                f"in {process_time:.3f}s"
            )
            
            # Add custom headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
        
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"[{request_id}] Error after {process_time:.3f}s: {str(e)}",
                exc_info=True
            )
            raise


class SessionStateLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log session state transitions"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Log if this was a session state change
        if request.url.path.startswith("/tryon/sessions"):
            method = request.method
            path = request.url.path
            
            if method == "POST":
                logger.info(f"Session state transition: NEW -> CREATED")
            elif method == "PATCH" or method == "PUT":
                logger.info(f"Session state transition on {path}")
        
        return response
