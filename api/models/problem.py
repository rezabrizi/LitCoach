from pydantic import BaseModel


class LeetcodeProblem(BaseModel):
    problem: str
    context: str
    code: str
    github_id: str
    llm: str


class LeetcodeSubmission(BaseModel):
    problem_name: str
    problem_description: str
    code: str
    language: str
    user_id: int
    repo_id: int
    runtime: str
    space: str
