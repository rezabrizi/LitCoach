from pydantic import BaseModel


class CreateRepo(BaseModel):
    user_id: str
    repo_name: str
