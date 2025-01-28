from pydantic import BaseModel


class User(BaseModel):
    user_id: str
    email: str
    avatar_url: str
    is_premium: bool = False
    premium_expiry: str = None
