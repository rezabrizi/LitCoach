from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class Message(BaseModel):
    role: str
    content: str


class ResponseStyle(str, Enum):
    normal = "normal"
    concise = "concise"
    interview = "interview"


class AIHelp(BaseModel):
    problem_description: str
    context: Optional[List[Message]]
    code: str
    prompt: str
    user_id: str
    response_style: Optional[ResponseStyle] = ResponseStyle.normal
