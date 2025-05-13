from pydantic import BaseModel, Field
from typing import Optional

class NoteBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)
    is_encrypted: bool = False

class NoteCreate(NoteBase):
    encryption_password: Optional[str] = None
    salt: Optional[str] = None  # For storing the salt for encrypted notes

class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = Field(None, min_length=1)
    is_encrypted: Optional[bool] = None
    encryption_password: Optional[str] = None
    old_encryption_password: Optional[str] = None  # Added for password changes on encrypted notes

class NoteSensitivity(BaseModel):
    sensitivity_score: int = Field(0, ge=0, le=100)
    explanation: str = ""

class Note(NoteBase):
    id: str
    user_id: str
    created_at: float
    updated_at: float
    salt: Optional[str] = None  # For encrypted notes, to store salt
    sensitivity: Optional[NoteSensitivity] = None 