from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class Message(BaseModel):
    role: str
    content: str


class ResponseStyle(str, Enum):
    normal = "normal"
    concise = "concise"


class modelName(str, Enum):
    gpt_4o = "gpt-4o"
    o3_mini = "o3-mini"


class AIHelp(BaseModel):
    problem_description: str
    context: Optional[List[Message]]
    code: str
    prompt: str
    user_id: str
    response_style: Optional[ResponseStyle] = ResponseStyle.normal
    model_name: Optional[modelName] = modelName.gpt_4o
