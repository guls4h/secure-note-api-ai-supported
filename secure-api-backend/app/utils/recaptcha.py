import httpx
from app.core.config import settings
from fastapi import HTTPException, status

class ReCaptchaError(Exception):
    """Custom exception for reCAPTCHA verification errors."""
    def __init__(self, message: str, error_codes: list = None):
        self.message = message
        self.error_codes = error_codes or []
        super().__init__(self.message)

async def verify_recaptcha(recaptcha_token: str) -> bool:
    """
    Verify a reCAPTCHA token with Google reCAPTCHA API.
    
    Args:
        recaptcha_token: The token to verify
        
    Returns:
        bool: True if verification successful, False otherwise
        
    Raises:
        ReCaptchaError: If specific reCAPTCHA errors are encountered
        HTTPException: If verification fails
    """
    if not recaptcha_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reCAPTCHA token is required"
        )
    
    if not settings.RECAPTCHA_SECRET_KEY:
        return True
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.google.com/recaptcha/api/siteverify",
                data={
                    "secret": settings.RECAPTCHA_SECRET_KEY,
                    "response": recaptcha_token
                }
            )
            
            result = response.json()
            
            if result.get("success", False):
                return True
            else:
                error_codes = result.get('error-codes', ['unknown error'])
                
                # Handle specific error cases
                if 'timeout-or-duplicate' in error_codes:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="reCAPTCHA token has expired or already been used. Please refresh and try again."
                    )
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"reCAPTCHA verification failed: {', '.join(error_codes)}"
                )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error connecting to reCAPTCHA service"
        ) 