from typing import Dict, Optional, List
import json

from app.core.database import get_redis_client, USER_PREFIX
from app.models.user import create_user_dict, update_user_dict, user_dict_to_schema, user_dict_to_db_schema
from app.schemas.user import UserCreate, User, UserUpdate, UserInDB
from app.utils.recaptcha import verify_recaptcha
from app.core.config import settings
from fastapi import HTTPException, status

async def create_user(user_create: UserCreate) -> User:
    """Create a new user in Redis."""
    
    # Verify reCAPTCHA token if enabled
    if settings.RECAPTCHA_ENABLED:
        if user_create.recaptcha_token:
            recaptcha_valid = await verify_recaptcha(user_create.recaptcha_token)
            if not recaptcha_valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="reCAPTCHA verification failed. Please try again."
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reCAPTCHA token is required."
            )
    
    user_dict = create_user_dict(user_create)
    
    async with get_redis_client() as redis:
        # Check if username already exists
        username_key = f"{USER_PREFIX}username:{user_create.username}"
        if await redis.exists(username_key):
            raise ValueError(f"Username {user_create.username} already exists")
        
        # Check if email already exists
        email_key = f"{USER_PREFIX}email:{user_create.email}"
        if await redis.exists(email_key):
            raise ValueError(f"Email {user_create.email} already exists")
        
        # Create a pipeline for atomic operations
        async with redis.pipeline() as pipe:
            # Store user data
            user_key = f"{USER_PREFIX}{user_dict['id']}"
            await pipe.hset(user_key, mapping=user_dict)
            
            # Create indexes for fast lookups
            await pipe.set(username_key, user_dict["id"])
            await pipe.set(email_key, user_dict["id"])
            
            # Execute pipeline
            await pipe.execute()
    
    return user_dict_to_schema(user_dict)

async def get_user_by_id(user_id: str) -> Optional[User]:
    """Get a user by ID."""
    async with get_redis_client() as redis:
        user_key = f"{USER_PREFIX}{user_id}"
        user_data = await redis.hgetall(user_key)
        
        if not user_data:
            return None
        
        return user_dict_to_schema(user_data)

async def get_user_by_username(username: str) -> Optional[UserInDB]:
    """Get a user by username including password."""
    async with get_redis_client() as redis:
        # Get user ID from username index
        username_key = f"{USER_PREFIX}username:{username}"
        user_id = await redis.get(username_key)
        
        if not user_id:
            return None
        
        # Get user data
        user_key = f"{USER_PREFIX}{user_id}"
        user_data = await redis.hgetall(user_key)
        
        if not user_data:
            return None
        
        return user_dict_to_db_schema(user_data)

async def update_user(user_id: str, user_update: UserUpdate) -> Optional[User]:
    """Update a user in Redis."""
    async with get_redis_client() as redis:
        user_key = f"{USER_PREFIX}{user_id}"
        user_data = await redis.hgetall(user_key)
        
        if not user_data:
            return None
        
        # If email is being updated, check if new email already exists
        if user_update.email is not None and user_update.email != user_data["email"]:
            old_email_key = f"{USER_PREFIX}email:{user_data['email']}"
            new_email_key = f"{USER_PREFIX}email:{user_update.email}"
            
            if await redis.exists(new_email_key):
                raise ValueError(f"Email {user_update.email} already exists")
            
            # Update email index in transaction
            async with redis.pipeline() as pipe:
                await pipe.delete(old_email_key)
                await pipe.set(new_email_key, user_id)
                await pipe.execute()
        
        # Update user data
        updated_user = update_user_dict(user_data, user_update)
        await redis.hset(user_key, mapping=updated_user)
        
        return user_dict_to_schema(updated_user)

async def delete_user(user_id: str) -> bool:
    """Delete a user from Redis."""
    async with get_redis_client() as redis:
        user_key = f"{USER_PREFIX}{user_id}"
        user_data = await redis.hgetall(user_key)
        
        if not user_data:
            return False
        
        # Delete all user data and indexes
        async with redis.pipeline() as pipe:
            username_key = f"{USER_PREFIX}username:{user_data['username']}"
            email_key = f"{USER_PREFIX}email:{user_data['email']}"
            
            await pipe.delete(username_key)
            await pipe.delete(email_key)
            await pipe.delete(user_key)
            
            await pipe.execute()
        
        return True 