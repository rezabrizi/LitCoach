from pydantic import BaseModel
from typing import List, Optional


class Message(BaseModel):
    role: str
    content: str


class AIHelp(BaseModel):
    problem_description: str
    context: Optional[List[Message]]
    code: str
    prompt: str
    user_id: str
    llm: str
