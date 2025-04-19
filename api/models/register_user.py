from pydantic import BaseModel
from typing import Optional


class RegisterUser(BaseModel):
    old_user_id: Optional[str] = None
    google_user_id: str
