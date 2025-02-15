from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    user_id: int
    email: Optional[str] = None
    access_token: str
    is_premium: bool = False
    premium_expiry: Optional[datetime] = None
    account_creation_date: datetime
    tokens_used_monthly: int
    tokens_used_in_past_5_hours: int
    last_monthly_token_reset: datetime
    last_5_hour_cooldown_reset: datetime
    subscription_id: Optional[str] = None
