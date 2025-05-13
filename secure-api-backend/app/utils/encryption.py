from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import os
from typing import Tuple

def generate_key_from_password(password: str, salt: bytes = None) -> Tuple[bytes, bytes]:
    """Generate a Fernet key from a password and salt."""
    if not salt:
        # Generate a fresh salt if none is provided
        salt = os.urandom(16)
    else:
        # Validate the salt
        if len(salt) < 16:
            # Pad salt if it's too short (should never happen in normal operation)
            salt = salt + os.urandom(16 - len(salt))
    
    # Ensure password is not empty
    if not password:
        raise ValueError("Password cannot be empty")
    
    try:
        # Use a consistent derivation approach for encryption/decryption
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        # Convert password to bytes if it isn't already
        password_bytes = password.encode('utf-8') if isinstance(password, str) else password
        
        # Derive key from password and salt
        derived_key = kdf.derive(password_bytes)
        
        # Encode as URL-safe base64 for Fernet
        key = base64.urlsafe_b64encode(derived_key)
        
        return key, salt
    except Exception as e:
        raise ValueError(f"Failed to generate encryption key: {str(e)}")

def encrypt_text(text: str, password: str) -> Tuple[str, bytes]:
    """Encrypt text using a password."""
    try:
        # Generate key and salt
        key, salt = generate_key_from_password(password)
        
        # Create Fernet cipher
        fernet = Fernet(key)
        
        # Encrypt the text
        encrypted_bytes = fernet.encrypt(text.encode())
        encrypted_text = encrypted_bytes.decode()
        
        return encrypted_text, salt
    except Exception as e:
        raise ValueError(f"Failed to encrypt text: {str(e)}")

def decrypt_text(encrypted_text: str, password: str, salt: bytes) -> str:
    """Decrypt text using a password and salt."""
    try:
        # Validate inputs to provide better error messages
        if not encrypted_text:
            raise ValueError("Encrypted text is empty")
        if not password:
            raise ValueError("Decryption password is empty")
        if not salt or len(salt) < 16:
            raise ValueError(f"Invalid salt for decryption (length: {len(salt) if salt else 0})")
        
        # Generate the same key using the provided password and salt
        key, _ = generate_key_from_password(password, salt)
        
        # Create Fernet cipher with the key
        fernet = Fernet(key)
        
        # Try various approaches to handle potential encoding issues
        error_details = []
        
        # Approach 1: Direct decryption of the string as UTF-8
        try:
            encrypted_bytes = encrypted_text.encode('utf-8')
            decrypted_bytes = fernet.decrypt(encrypted_bytes)
            decrypted_text = decrypted_bytes.decode('utf-8')
            return decrypted_text
        except Exception as e:
            error_details.append(f"Approach 1 failed: {str(e)}")
        
        # Approach 2: Fix potential padding issues
        try:
            padded_text = encrypted_text + '=' * (-len(encrypted_text) % 4)
            encrypted_bytes = padded_text.encode('utf-8')
            decrypted_bytes = fernet.decrypt(encrypted_bytes)
            decrypted_text = decrypted_bytes.decode('utf-8')
            return decrypted_text
        except Exception as e:
            error_details.append(f"Approach 2 failed: {str(e)}")
        
        # If we've made it here, all approaches failed
        if "Invalid token" in '; '.join(error_details):
            raise ValueError("Invalid decryption password")
        else:
            raise ValueError(f"Decryption failed due to format issues: {'; '.join(error_details)}")
            
    except ValueError as e:
        # Re-raise ValueError with the original message
        raise
    except Exception as e:
        raise ValueError(f"Failed to decrypt: {str(e)}") 