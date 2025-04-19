from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    user_id: Optional[str] = None
    google_user_id: Optional[str] = None
    github_id: Optional[int] = None
    access_token: Optional[str] = None
    has_premium: bool = False
    premium_expiry: Optional[str] = None
    tokens_used_monthly: int
    tokens_used_in_past_5_hours: int
    last_monthly_token_reset: str
    last_5_hour_cooldown_reset: str
    subscription_id: Optional[str] = None
