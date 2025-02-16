from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    user_id: str
    github_id: int
    email: Optional[str] = None
    access_token: str
    has_premium: bool = False
    premium_expiry: Optional[str] = None
    account_creation_date: str
    tokens_used_monthly: int
    tokens_used_in_past_5_hours: int
    last_monthly_token_reset: str
    last_5_hour_cooldown_reset: str
    subscription_id: Optional[str] = None
