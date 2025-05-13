from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional

from app.services.note_service import (
    create_note, 
    get_note_by_id, 
    get_user_notes, 
    update_note, 
    delete_note
)
from app.schemas.note import Note, NoteCreate, NoteUpdate
from app.schemas.user import User
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED)
async def create_user_note(
    note_create: NoteCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new note for the current user."""
    try:
        note = await create_note(note_create, current_user.id)
        return note
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )

@router.get("/", response_model=List[Note])
async def read_user_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get all notes for the current user."""
    try:
        notes = await get_user_notes(current_user.id, skip, limit)
        return notes
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve notes: {str(e)}"
        )

@router.get("/{note_id}", response_model=Note)
async def read_user_note(
    note_id: str,
    decrypt_password: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific note for the current user.
    
    For encrypted notes, provide the decrypt_password as a query parameter to view decrypted content.
    """
    try:
        note = await get_note_by_id(note_id, current_user.id, decrypt_password)
        
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        
        # Check if the note is encrypted and needs decryption
        if note.is_encrypted and (note.content.startswith("[Encrypted content") or "[Encrypted content" in note.content):
            if not decrypt_password:
                # Keep the placeholder message but don't raise an error
                pass
            else:
                # Password was provided but decryption failed - raise error
                if "[Encrypted content - " in note.content:
                    error_message = note.content.split("[Encrypted content - ")[1].split("]")[0]
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to decrypt note: {error_message}"
                    )
            
        return note
    except ValueError as e:
        # This is for decryption errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to decrypt note: {str(e)}"
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve note: {str(e)}"
        )

@router.put("/{note_id}", response_model=Note)
async def update_user_note(
    note_id: str,
    note_update: NoteUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update a specific note for the current user.
    
    If updating an encrypted note or adding encryption, provide the encryption_password.
    """
    try:
        note = await update_note(note_id, current_user.id, note_update)
        if not note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
        return note
    except ValueError as e:
        # This is for encryption errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update note: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}"
        )

@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_note(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a specific note for the current user."""
    try:
        deleted = await delete_note(note_id, current_user.id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}"
        )

@router.post("/{note_id}/recreate", response_model=Note, status_code=status.HTTP_201_CREATED)
async def recreate_note(
    note_id: str,
    note_create: NoteCreate,
    delete_original: bool = Query(False, description="Whether to delete the original note after recreation"),
    decrypt_password: Optional[str] = Query(None, description="Password to decrypt the original note if needed"),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new note with the same data as an existing note but with potentially different encryption settings.
    Useful for changing encryption passwords properly.
    
    Optionally delete the original note after successful recreation.
    """
    try:
        # First, get the original note with decryption if provided
        original_note = await get_note_by_id(
            note_id, 
            current_user.id, 
            decrypt_password  # Use the provided decrypt password
        )
        
        if not original_note:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Original note not found"
            )
        
        # Check if content is still encrypted (decrypt failed or no password provided)
        if original_note.is_encrypted and "[Encrypted content" in original_note.content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot recreate note: original content could not be decrypted. Please provide the correct decryption password."
            )
        
        # Use the original note's data but override with the provided values
        # This allows changing encryption status or password while keeping the same content
        create_data = {
            "title": note_create.title if note_create.title is not None else original_note.title,
            "content": note_create.content if note_create.content is not None else original_note.content,
            "is_encrypted": note_create.is_encrypted,
            "encryption_password": note_create.encryption_password
        }
        
        # Create the new note
        new_note = await create_note(NoteCreate(**create_data), current_user.id)
        
        # Optionally delete the original note
        if delete_original:
            await delete_note(note_id, current_user.id)
            
        return new_note
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to recreate note: {str(e)}"
        ) 