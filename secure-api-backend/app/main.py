from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.api import api_router
from app.core.config import settings
from app.core.database import initialize_redis, close_redis
from app.middlewares.rate_limiter import RateLimiter
from app.middlewares.security import SecurityHeadersMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup events
    await initialize_redis()
    yield
    # Shutdown events
    await close_redis()

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    lifespan=lifespan,
)

# Add rate limiting middleware
app.add_middleware(
    RateLimiter,
    requests_limit=100,  # 100 requests
    window_seconds=60,   # per minute
    exempt_paths={
        f"{settings.API_V1_PREFIX}/docs": True,
        f"{settings.API_V1_PREFIX}/redoc": True,
        f"{settings.API_V1_PREFIX}/openapi.json": True,
    }
)

# Add security headers middleware (for XSS protection)
app.add_middleware(
    SecurityHeadersMiddleware,
    content_security_policy=settings.CONTENT_SECURITY_POLICY,
    enable_xss_protection=settings.ENABLE_XSS_PROTECTION,
)

# Add CORS middleware last (so it runs first in the request lifecycle)
# During development, allow all origins for Swagger UI to work properly
# In production, this should be more restrictive
if settings.DEBUG:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins in debug mode
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Root endpoint for health check
@app.get("/", include_in_schema=False)
async def health_check():
    return {"status": "ok", "message": "Secure Note API is running!"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    ) 