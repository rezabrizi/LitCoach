from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class Message(BaseModel):
    role: str
    content: str


class ResponseStyle(str, Enum):
    normal = "normal"
    concise = "concise"


class ModelName(str, Enum):
    gpt_4o = "gpt-4o"
    o3_mini = "o3-mini"


class AIAssistance(BaseModel):
    problem_description: str
    context: Optional[List[Message]]
    code: str
    prompt: str
    user_id: Optional[str] = None
    google_user_id: Optional[str] = None
    response_style: Optional[ResponseStyle] = ResponseStyle.normal
    model_name: Optional[ModelName] = ModelName.gpt_4o
