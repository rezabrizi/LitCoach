from pydantic import BaseModel

class LeetCodeSubmission(BaseModel):
    language: str
    title: str
    problem_number: str
    problem_description: str
    solution: str
    runtime: str
    runtime_rank: str
    space: str
    space_rank: str
    access_token: str
    repo_name: str
