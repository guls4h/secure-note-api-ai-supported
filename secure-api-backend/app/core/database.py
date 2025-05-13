import redis.asyncio as redis
from contextlib import asynccontextmanager
from app.core.config import settings

# Redis key prefixes
USER_PREFIX = "user:"
NOTE_PREFIX = "note:"
USER_NOTES_PREFIX = "user_notes:"

async def get_redis_pool():
    """Create and return a Redis connection pool."""
    redis_url = f"redis://{':' + settings.REDIS_PASSWORD + '@' if settings.REDIS_PASSWORD else ''}{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
    return redis.ConnectionPool.from_url(redis_url, decode_responses=True)

# Global connection pool
redis_pool = None

@asynccontextmanager
async def get_redis_client():
    """Get a Redis client from the connection pool."""
    global redis_pool
    if redis_pool is None:
        redis_pool = await get_redis_pool()
    
    client = redis.Redis(connection_pool=redis_pool)
    try:
        yield client
    finally:
        await client.close()

async def initialize_redis():
    """Initialize Redis connection at application startup."""
    global redis_pool
    redis_pool = await get_redis_pool()
    
async def close_redis():
    """Close Redis connections at application shutdown."""
    global redis_pool
    if redis_pool:
        await redis_pool.disconnect()
        redis_pool = None 