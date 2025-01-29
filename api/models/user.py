from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    access_token: str
    is_premium: bool = False
    premium_expiry: Optional[str] = None
