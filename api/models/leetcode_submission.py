from pydantic import BaseModel
from typing import Optional


class LangInfo(BaseModel):
    name: str
    verboseName: str


class QuestionInfo(BaseModel):
    questionId: str
    title: str
    titleSlug: str
    content: str
    difficulty: str


class LeetCodeSubmission(BaseModel):
    runtimeDisplay: str
    runtimePercentile: float
    memoryDisplay: str
    memoryPercentile: float
    code: str
    timestamp: int
    lang: LangInfo
    question: QuestionInfo
    runtimeError: Optional[str] = None
    compileError: Optional[str] = None
    user_github_id: int
    github_repo_id: int
