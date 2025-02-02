from pydantic import BaseModel
from datetime import datetime


class Usage(BaseModel):
    user_id: int
    problem_name: str
    ts: datetime
    tokens: int
    ai_model: str
