from pydantic import BaseModel
from typing import Optional


class UnsubscribeRequest(BaseModel):
    user_id: Optional[str] = None
    google_user_id: Optional[str] = None


class SubscribeRequest(BaseModel):
    user_id: Optional[str] = None
    google_user_id: Optional[str] = None
