from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time
from typing import Dict, Optional, Callable, Union

from app.core.database import get_redis_client

class RateLimiter(BaseHTTPMiddleware):
    """Rate limiter middleware using Redis."""
    
    def __init__(
        self,
        app,
        requests_limit: int = 100,
        window_seconds: int = 60,
        prefix: str = "rate_limit:",
        exempt_paths: Optional[Dict[str, bool]] = None,
        get_key: Optional[Callable[[Request], str]] = None,
    ):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.prefix = prefix
        self.exempt_paths = exempt_paths or {}
        self.get_key = get_key or self._default_key_func
    
    async def dispatch(self, request: Request, call_next):
        """Handle request and check rate limits."""
        if self._is_exempt(request):
            return await call_next(request)
        
        rate_limit_key = self.get_key(request)
        
        # Check and update rate limit
        async with get_redis_client() as redis:
            current_time = int(time.time())
            window_start = current_time - self.window_seconds
            
            # Create a Redis key
            key = f"{self.prefix}{rate_limit_key}"
            
            # Use a Redis pipeline for atomic operations
            async with redis.pipeline() as pipe:
                # Remove any hits older than the window
                await pipe.zremrangebyscore(key, 0, window_start)
                
                # Count current hits within the window
                await pipe.zcard(key)
                
                # Add current request timestamp to the sorted set
                await pipe.zadd(key, {str(current_time): current_time})
                
                # Set expiration on the key to auto-cleanup
                await pipe.expire(key, self.window_seconds * 2)
                
                # Execute pipeline and get results
                results = await pipe.execute()
                hit_count = results[1]
            
            # Check if rate limit is exceeded
            if hit_count > self.requests_limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded. Please try again later.",
                    headers={"Retry-After": str(self.window_seconds)},
                )
        
        # Process the request if rate limit is not exceeded
        return await call_next(request)
    
    def _is_exempt(self, request: Request) -> bool:
        """Check if the path is exempt from rate limiting."""
        path = request.url.path
        return path in self.exempt_paths and self.exempt_paths[path]
    
    def _default_key_func(self, request: Request) -> str:
        """Default function to generate a rate limiting key."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        return f"{client_ip}:{request.url.path}" 