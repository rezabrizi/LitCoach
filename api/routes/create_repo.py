from fastapi import APIRouter, HTTPException
from api.services import create_github_repo
from api.db import user_exists
from api.models import CreateRepo


router = APIRouter()


@router.post("/create_repo")
def create_repo(request: CreateRepo):
    try:
        user = user_exists(request.github_id)
        if not user:
            raise HTTPException(status_code=403, details="User not found!")
        repo_id = create_github_repo(request.repo_name, user.access_token)
        return {
            "message": "Repo created successfully!",
            "repo_id": repo_id,
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")