from pydantic import BaseModel


class UnsubscribeRequest(BaseModel):
    user_id: str


class SubscribeRequest(BaseModel):
    user_id: str
