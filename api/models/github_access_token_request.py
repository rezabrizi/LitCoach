from pydantic import BaseModel


class GithubAccessTokenRequest(BaseModel):
    github_code: str
