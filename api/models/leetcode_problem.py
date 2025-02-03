from pydantic import BaseModel


class LeetcodeProblem(BaseModel):
    problem: str
    context: str
    code: str
    github_id: str
    llm: str
