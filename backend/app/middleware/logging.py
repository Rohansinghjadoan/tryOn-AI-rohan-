"""Request / response logging middleware."""

from __future__ import annotations

import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Attach a unique request-id and log request + response timing."""

    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())[:8]
        request.state.request_id = req_id
        start = time.time()

        logger.info("[%s] %s %s", req_id, request.method, request.url.path)

        try:
            response = await call_next(request)
            elapsed = time.time() - start
            logger.info("[%s] %s in %.3fs", req_id, response.status_code, elapsed)
            response.headers["X-Request-ID"] = req_id
            return response
        except Exception as exc:
            elapsed = time.time() - start
            logger.error("[%s] Error after %.3fs: %s", req_id, elapsed, exc, exc_info=True)
            raise
