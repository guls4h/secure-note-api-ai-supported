from typing import Dict, Optional, List
import time
import uuid
from app.schemas.user import UserCreate, User, UserInDB, UserUpdate

def create_user_dict(user_create: UserCreate) -> Dict:
    """Create a new user dictionary for Redis."""
    from app.core.security import get_password_hash
    
    now = time.time()
    user_id = str(uuid.uuid4())
    
    return {
        "id": user_id,
        "username": user_create.username,
        "email": user_create.email,
        "full_name": user_create.full_name or "",
        "hashed_password": get_password_hash(user_create.password),
        "created_at": now,
        "updated_at": now
    }

def update_user_dict(user_dict: Dict, user_update: UserUpdate) -> Dict:
    """Update a user dictionary with new values."""
    from app.core.security import get_password_hash
    
    updated_dict = user_dict.copy()
    updated_dict["updated_at"] = time.time()
    
    if user_update.email is not None:
        updated_dict["email"] = user_update.email
    
    if user_update.full_name is not None:
        updated_dict["full_name"] = user_update.full_name
    
    if user_update.password is not None:
        updated_dict["hashed_password"] = get_password_hash(user_update.password)
    
    return updated_dict

def user_dict_to_schema(user_dict: Dict) -> User:
    """Convert a user dictionary to a User schema."""
    return User(
        id=user_dict["id"],
        username=user_dict["username"],
        email=user_dict["email"],
        full_name=user_dict["full_name"] if user_dict["full_name"] else None,
        created_at=float(user_dict["created_at"]),
        updated_at=float(user_dict["updated_at"])
    )

def user_dict_to_db_schema(user_dict: Dict) -> UserInDB:
    """Convert a user dictionary to a UserInDB schema."""
    return UserInDB(
        id=user_dict["id"],
        username=user_dict["username"],
        email=user_dict["email"],
        full_name=user_dict["full_name"] if user_dict["full_name"] else None,
        hashed_password=user_dict["hashed_password"],
        created_at=float(user_dict["created_at"]),
        updated_at=float(user_dict["updated_at"])
    ) 