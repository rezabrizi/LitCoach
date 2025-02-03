from pydantic import BaseModel


class CreateRepo(BaseModel):
    github_id: int
    repo_name: str