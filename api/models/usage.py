from pydantic import BaseModel
from datetime import datetime


class Usage(BaseModel):
    user_id: int
    problem_name: str
    ts: datetime
    ai_model: str
    input_tokens: str
    output_tokens: str
