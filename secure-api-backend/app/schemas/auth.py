from pydantic import BaseModel
from typing import Optional

class TokenData(BaseModel):
    username: str

class LoginRequest(BaseModel):
    username: str
    password: str
    recaptcha_token: Optional[str] = None 