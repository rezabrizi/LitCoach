from pydantic import BaseModel
from typing import Optional


class CreateRepo(BaseModel):
    user_id: Optional[str] = None
    google_user_id: Optional[str] = None
    repo_name: str
    github_access_token: Optional[str] = None  # Optional for legacy users
