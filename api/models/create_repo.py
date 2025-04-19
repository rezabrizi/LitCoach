from pydantic import BaseModel
from typing import Optional


class CreateRepo(BaseModel):
    user_id: str
    repo_name: str
    access_token: Optional[str] = None  # Optional for legacy users
