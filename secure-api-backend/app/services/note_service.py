from typing import Dict, Optional, List
import json
import time
import base64
import uuid

from app.core.database import get_redis_client, NOTE_PREFIX, USER_NOTES_PREFIX
from app.models.note import create_note_dict, update_note_dict, note_dict_to_schema
from app.schemas.note import NoteCreate, Note, NoteUpdate, NoteSensitivity
from app.utils.encryption import encrypt_text, decrypt_text
from app.services.sensitivity_service import analyze_note_sensitivity

async def create_note(note_create: NoteCreate, user_id: str) -> Note:
    """Create a new note in Redis."""
    # Check if is_encrypted is None and set a default
    if note_create.is_encrypted is None:
        note_create_dict = note_create.model_dump()
        note_create_dict["is_encrypted"] = False
        note_create = NoteCreate(**note_create_dict)
    
    # Store original content for sensitivity analysis
    original_content = note_create.content
    
    # Handle encryption if requested
    if note_create.is_encrypted and note_create.encryption_password:
        encrypted_content, salt = encrypt_text(note_create.content, note_create.encryption_password)
        # Store the encrypted content and salt
        note_create_dict = note_create.model_dump()
        note_create_dict["content"] = encrypted_content
        salt_b64 = base64.b64encode(salt).decode()
        note_create_dict["salt"] = salt_b64
        # Remove the password from what gets stored
        note_create_dict.pop("encryption_password", None)
        note_create = NoteCreate(**note_create_dict)
    
    # Create the note dict
    note_dict = create_note_dict(note_create, user_id)
    
    # Analyze content sensitivity (use original unencrypted content)
    sensitivity_data = await analyze_note_sensitivity(original_content)
    
    # Add sensitivity data to note_dict
    note_dict["sensitivity_score"] = str(sensitivity_data["sensitivity_score"])
    note_dict["sensitivity_explanation"] = sensitivity_data["explanation"]
    
    async with get_redis_client() as redis:
        try:
            # Create a pipeline for atomic operations
            async with redis.pipeline() as pipe:
                # Store note data
                note_key = f"{NOTE_PREFIX}{note_dict['id']}"
                await pipe.hset(note_key, mapping=note_dict)
                
                # Add note ID to user's notes set
                user_notes_key = f"{USER_NOTES_PREFIX}{user_id}"
                await pipe.zadd(user_notes_key, {note_dict["id"]: time.time()})
                
                # Execute pipeline
                await pipe.execute()
        except Exception as e:
            raise
    
    return note_dict_to_schema(note_dict)

async def get_note_by_id(note_id: str, user_id: str, decrypt_password: Optional[str] = None) -> Optional[Note]:
    """Get a note by ID, ensuring it belongs to the user."""
    async with get_redis_client() as redis:
        note_key = f"{NOTE_PREFIX}{note_id}"
        note_data = await redis.hgetall(note_key)
        
        if not note_data:
            return None
        
        # Verify that the note belongs to the user
        if note_data["user_id"] != user_id:
            return None
        
        # Make a proper boolean check for is_encrypted
        is_encrypted = note_data.get("is_encrypted", "False").lower() == "true"
        
        # Decrypt content if note is encrypted and password is provided
        if is_encrypted and decrypt_password:
            
            if "salt" not in note_data:
                # Create a more specific error message
                error_note = note_data.copy()
                error_note["content"] = "[Encrypted content - Missing encryption salt]"
                return note_dict_to_schema(error_note)
            
            try:
                # Correctly convert from string to binary
                salt_str = note_data["salt"]
                
                try:
                    # Try to decode the salt - handle potential encoding issues
                    salt = base64.b64decode(salt_str)
                except Exception:
                    # Try alternative encoding or ensure padding
                    padded_salt_str = salt_str + "=" * (-len(salt_str) % 4)
                    salt = base64.b64decode(padded_salt_str)
                
                # Get the encrypted content
                encrypted_content = note_data["content"]
                
                try:
                    # Decrypt and update the content
                    decrypted_content = decrypt_text(encrypted_content, decrypt_password, salt)
                    
                    # Create a new dictionary with decrypted content
                    decrypted_note_data = note_data.copy()
                    decrypted_note_data["content"] = decrypted_content
                    
                    # Return the schema with decrypted content
                    return note_dict_to_schema(decrypted_note_data)
                except ValueError as e:
                    # Return a more specific error message in the note content
                    error_note = note_data.copy()
                    error_note["content"] = f"[Encrypted content - {str(e)}]"
                    return note_dict_to_schema(error_note)
            except Exception as e:
                error_note = note_data.copy()
                error_note["content"] = f"[Encrypted content - Decryption failed: {str(e)}]"
                return note_dict_to_schema(error_note)
        elif is_encrypted:
            # Provide a helpful message in the content
            encrypted_note = note_data.copy()
            encrypted_note["content"] = "[Encrypted content - Password required to view]"
            return note_dict_to_schema(encrypted_note)
        
        return note_dict_to_schema(note_data)

async def get_user_notes(user_id: str, skip: int = 0, limit: int = 100) -> List[Note]:
    """Get all notes for a user with pagination."""
    async with get_redis_client() as redis:
        # Get note IDs from user's notes set, ordered by most recently updated
        user_notes_key = f"{USER_NOTES_PREFIX}{user_id}"
        note_ids = await redis.zrevrange(user_notes_key, skip, skip + limit - 1)
        
        if not note_ids:
            return []
        
        # Get all notes data
        notes = []
        for note_id in note_ids:
            note_key = f"{NOTE_PREFIX}{note_id}"
            note_data = await redis.hgetall(note_key)
            
            if note_data:
                notes.append(note_dict_to_schema(note_data))
        
        return notes

async def update_note(note_id: str, user_id: str, note_update: NoteUpdate) -> Optional[Note]:
    """Update a note in Redis."""
    async with get_redis_client() as redis:
        note_key = f"{NOTE_PREFIX}{note_id}"
        note_data = await redis.hgetall(note_key)
        
        if not note_data:
            return None
        
        # Verify that the note belongs to the user
        if note_data["user_id"] != user_id:
            return None
        
        # Check if the note was originally encrypted
        was_encrypted = note_data.get("is_encrypted", "False").lower() == "true"
        
        # Determine if the note should be encrypted after the update
        new_is_encrypted = note_update.is_encrypted if note_update.is_encrypted is not None else was_encrypted
        
        # Store original content for sensitivity analysis
        original_content = None
        
        # Handle different encryption scenarios
        if was_encrypted and new_is_encrypted and note_update.old_encryption_password:
            # Password change scenario for encrypted note - need to decrypt with old password first
            if "salt" in note_data:
                try:
                    salt_str = note_data["salt"]
                    try:
                        salt = base64.b64decode(salt_str)
                    except Exception as salt_error:
                        padded_salt_str = salt_str + "=" * (-len(salt_str) % 4)
                        salt = base64.b64decode(padded_salt_str)
                    
                    # Try to decrypt the content with old password
                    encrypted_content = note_data["content"]
                    try:
                        # Decrypt the existing content with the old password
                        decrypted_content = decrypt_text(encrypted_content, note_update.old_encryption_password, salt)
                        
                        # If we're changing password but not content, use the decrypted content
                        if note_update.content is None:
                            # Set the original decrypted content to be re-encrypted with new password
                            note_update_dict = note_update.model_dump(exclude_unset=True)
                            note_update_dict["content"] = decrypted_content
                            note_update = NoteUpdate(**note_update_dict)
                        
                        # Store for sensitivity analysis
                        original_content = note_update.content
                        
                        # Now we'll re-encrypt below with the new password
                    except ValueError as e:
                        raise ValueError("Failed to decrypt with old password. Please make sure it is correct.")
                except Exception as e:
                    raise ValueError(f"Error during password change: {str(e)}")
            else:
                raise ValueError("Missing encryption salt. Cannot change password.")
        elif note_update.content is not None:
            original_content = note_update.content
        
        # Create a modified note_update to apply
        modified_note_update = note_update
        
        # Handle encryption state transitions
        if new_is_encrypted and not was_encrypted:
            # Unencrypted to encrypted transition
            if not note_update.encryption_password:
                raise ValueError("Password is required to encrypt a note")
                
            content_to_encrypt = note_update.content or note_data.get("content", "")
            original_content = content_to_encrypt
            
            # Encrypt with new password and salt
            encrypted_content, salt = encrypt_text(content_to_encrypt, note_update.encryption_password)
            salt_b64 = base64.b64encode(salt).decode()
            
            # Create updated note data
            update_dict = note_update.model_dump(exclude_unset=True)
            update_dict["content"] = encrypted_content
            update_dict["salt"] = salt_b64
            
            # Remove sensitive data
            update_dict.pop("encryption_password", None)
            update_dict.pop("old_encryption_password", None)
            
            modified_note_update = NoteUpdate(**update_dict)
            
            # Explicitly ensure the salt gets stored in Redis
            try:
                # Set the salt field directly to ensure it's stored
                await redis.hset(note_key, "salt", salt_b64)
                
                # Verify the salt was stored
                stored_salt = await redis.hget(note_key, "salt")
                if not stored_salt:
                    raise ValueError("Failed to store encryption salt in database")
            except Exception as e:
                # Continue with the update even if verification fails
                pass
        elif was_encrypted and not new_is_encrypted:
            # Encrypted to unencrypted transition
            
            # Create a completely new note dict without the salt
            clean_note_dict = {}
            for key, value in note_data.items():
                if key != "salt":
                    clean_note_dict[key] = value
            
            # Use a more direct approach - delete and recreate the hash without the salt
            try:
                async with redis.pipeline() as pipe:
                    # Delete the entire note hash
                    await pipe.delete(note_key)
                    
                    # Recreate without the salt
                    if clean_note_dict:
                        await pipe.hset(note_key, mapping=clean_note_dict)
                    
                    # Execute pipeline
                    await pipe.execute()
                
                # Verify salt was removed
                note_data = await redis.hgetall(note_key)
                if "salt" in note_data:
                    raise ValueError("Failed to remove encryption salt")
            except Exception as e:
                # Continue with the update even if salt removal fails
                pass
            
            # Also ensure salt is not in the update data
            if hasattr(modified_note_update, "salt"):
                update_dict = modified_note_update.model_dump(exclude_unset=True)
                update_dict.pop("salt", None)
                modified_note_update = NoteUpdate(**update_dict)
        
        # Update note data
        updated_note = update_note_dict(note_data, modified_note_update)
        
        # Re-analyze sensitivity if content was updated
        if original_content is not None:
            # Analyze content sensitivity
            sensitivity_data = await analyze_note_sensitivity(original_content)
            
            # Add sensitivity data to updated_note
            updated_note["sensitivity_score"] = str(sensitivity_data["sensitivity_score"])
            updated_note["sensitivity_explanation"] = sensitivity_data["explanation"]
        
        # Create a pipeline for atomic operations
        async with redis.pipeline() as pipe:
            # Store updated note data
            await pipe.hset(note_key, mapping=updated_note)
            
            # Update timestamp in user's notes set for sorting
            user_notes_key = f"{USER_NOTES_PREFIX}{user_id}"
            await pipe.zadd(user_notes_key, {note_id: time.time()})
            
            # Execute pipeline
            await pipe.execute()
        
        return note_dict_to_schema(updated_note)

async def delete_note(note_id: str, user_id: str) -> bool:
    """Delete a note from Redis."""
    async with get_redis_client() as redis:
        note_key = f"{NOTE_PREFIX}{note_id}"
        note_data = await redis.hgetall(note_key)
        
        if not note_data:
            return False
        
        # Verify that the note belongs to the user
        if note_data["user_id"] != user_id:
            return False
        
        # Delete note data and remove from user's notes set
        async with redis.pipeline() as pipe:
            await pipe.delete(note_key)
            
            # Remove note ID from user's notes set
            user_notes_key = f"{USER_NOTES_PREFIX}{user_id}"
            await pipe.zrem(user_notes_key, note_id)
            
            # Execute pipeline
            await pipe.execute()
        
        return True 