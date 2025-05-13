from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from typing import Optional

from app.core.security import verify_password, create_access_token
from app.services.user_service import get_user_by_username
from app.schemas.token import Token
from app.core.config import settings
from app.utils.recaptcha import verify_recaptcha

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    recaptcha_token: Optional[str] = Form(None)
):
    """Login endpoint to get JWT token."""
    
    # Verify reCAPTCHA token if enabled
    if settings.RECAPTCHA_ENABLED:
        if not recaptcha_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="reCAPTCHA verification is required"
            )
            
        try:
            # This will raise HTTPException with specific error if validation fails
            await verify_recaptcha(recaptcha_token)
        except HTTPException as e:
            # Just re-raise the exception
            raise
    
    user = await get_user_by_username(form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer") 