from pydantic import BaseModel


class GithubCode(BaseModel):
    code: str
