from pydantic import BaseModel
from datetime import date
from typing import Optional


class User(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    access_token: str
    is_premium: bool = False
    premium_expiry: Optional[str] = None
    account_creation_date: date
    tokens: int
    last_reset: date
