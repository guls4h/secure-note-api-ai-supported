from typing import Dict, Optional, List
import time
import uuid
from app.schemas.note import NoteCreate, Note, NoteUpdate, NoteSensitivity

def create_note_dict(note_create: NoteCreate, user_id: str) -> Dict:
    """Create a new note dictionary for Redis."""
    now = time.time()
    note_id = str(uuid.uuid4())
    
    # Create the base note dictionary
    note_dict = {
        "id": note_id,
        "user_id": str(user_id),
        "title": note_create.title or "",
        "content": note_create.content or "",
        "is_encrypted": str(bool(note_create.is_encrypted)),
        "created_at": str(now),
        "updated_at": str(now),
        "sensitivity_score": "0",
        "sensitivity_explanation": ""
    }
    
    # Add salt if it exists (for encrypted notes)
    # Check for salt in both object attributes and model_dump
    if hasattr(note_create, "salt") and note_create.salt is not None:
        note_dict["salt"] = str(note_create.salt)
    elif isinstance(note_create.model_dump(), dict) and "salt" in note_create.model_dump() and note_create.model_dump().get("salt") is not None:
        note_dict["salt"] = str(note_create.model_dump().get("salt"))
    
    # Ensure all values are strings
    for key, value in list(note_dict.items()):
        if value is None:
            note_dict[key] = ""
        elif not isinstance(value, str):
            note_dict[key] = str(value)
    
    return note_dict

def update_note_dict(note_dict: Dict, note_update: NoteUpdate) -> Dict:
    """Update a note dictionary with new values."""
    updated_dict = note_dict.copy()
    updated_dict["updated_at"] = str(time.time())
    
    if note_update.title is not None:
        updated_dict["title"] = note_update.title or ""
    
    if note_update.content is not None:
        updated_dict["content"] = note_update.content or ""
    
    if note_update.is_encrypted is not None:
        updated_dict["is_encrypted"] = str(bool(note_update.is_encrypted))
    
    # Add salt if it exists (for encrypted notes)
    # Check for salt in both object attributes and model_dump
    if hasattr(note_update, "salt") and note_update.salt is not None:
        updated_dict["salt"] = str(note_update.salt)
    elif isinstance(note_update.model_dump(exclude_unset=True), dict) and "salt" in note_update.model_dump(exclude_unset=True):
        updated_dict["salt"] = str(note_update.model_dump(exclude_unset=True).get("salt") or "")
    
    # Ensure all values are strings for Redis
    for key, value in list(updated_dict.items()):
        if value is None:
            updated_dict[key] = ""
        elif not isinstance(value, str):
            updated_dict[key] = str(value)
    
    return updated_dict

def note_dict_to_schema(note_dict: Dict) -> Note:
    """Convert a note dictionary to a Note schema."""
    # Convert string booleans back to Python booleans
    try:
        is_encrypted = note_dict.get("is_encrypted", "False").lower() == "true"
    except AttributeError:
        # Handle case where is_encrypted might not be a string
        is_encrypted = bool(note_dict.get("is_encrypted", False))
    
    # Ensure created_at and updated_at are valid floats
    try:
        created_at = float(note_dict.get("created_at", time.time()))
    except (ValueError, TypeError):
        created_at = time.time()
        
    try:
        updated_at = float(note_dict.get("updated_at", time.time()))
    except (ValueError, TypeError):
        updated_at = time.time()
    
    # Create sensitivity information
    sensitivity = NoteSensitivity(
        sensitivity_score=int(note_dict.get("sensitivity_score", 0)),
        explanation=note_dict.get("sensitivity_explanation", "")
    )
    
    # Create base note fields with default values for missing fields
    note_data = {
        "id": note_dict.get("id", str(uuid.uuid4())),
        "user_id": note_dict.get("user_id", ""),
        "title": note_dict.get("title", ""),
        "content": note_dict.get("content", ""),
        "is_encrypted": is_encrypted,
        "created_at": created_at,
        "updated_at": updated_at,
        "sensitivity": sensitivity
    }
    
    # Add salt if it exists and the note is encrypted
    if is_encrypted and "salt" in note_dict and note_dict.get("salt") is not None:
        note_data["salt"] = note_dict.get("salt")
    
    return Note(**note_data) 