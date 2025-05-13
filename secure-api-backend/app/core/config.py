from pydantic_settings import BaseSettings
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # API configs
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    PROJECT_NAME: str = "Secure Note API"
    
    # Redis configs
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD: Optional[str] = os.getenv("REDIS_PASSWORD", None)
    
    # Security configs
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_super_secret_key_for_jwt_tokens")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
    
    # CORS configs
    CORS_ORIGINS: List[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    CORS_ALLOW_CREDENTIALS: bool = os.getenv("CORS_ALLOW_CREDENTIALS", "True").lower() == "true"
    CORS_ALLOW_METHODS: List[str] = os.getenv("CORS_ALLOW_METHODS", "GET,POST,PUT,DELETE,OPTIONS").split(",")
    CORS_ALLOW_HEADERS: List[str] = os.getenv("CORS_ALLOW_HEADERS", "Authorization,Content-Type").split(",")
    
    # Security headers config
    ENABLE_XSS_PROTECTION: bool = os.getenv("ENABLE_XSS_PROTECTION", "True").lower() == "true"
    CONTENT_SECURITY_POLICY: Optional[str] = os.getenv(
        "CONTENT_SECURITY_POLICY", 
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google.com https://www.gstatic.com; font-src 'self' data:; connect-src 'self' https://www.google.com; frame-src 'self' https://www.google.com"
    )
    
    # reCAPTCHA settings
    RECAPTCHA_SECRET_KEY: str = os.getenv("RECAPTCHA_SECRET_KEY", "6LeV8DQrAAAAAOtJxh3eVv1TjnXETSOnTsIz4frV")
    RECAPTCHA_SITE_KEY: str = os.getenv("RECAPTCHA_SITE_KEY", "6LeV8DQrAAAAAFSJjM5FZ5LI-AjvC-5rJPPpb_fP")
    RECAPTCHA_ENABLED: bool = os.getenv("RECAPTCHA_ENABLED", "True").lower() == "true"

settings = Settings() 