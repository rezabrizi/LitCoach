from pydantic import BaseModel


class LeetcodeSubmission(BaseModel):
    question_id: str
    question_title: str
    question_content: str
    code: str
    language: str
    user_github_id: int
    github_repo_id: int
    runtime: str
    runtime_percentile: str
    memory: str
    memory_percentile: str
