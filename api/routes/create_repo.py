from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.services import create_github_repo
from api.db import resolve_user
from api.models import CreateRepo

router = APIRouter()


@router.post("/repo")
def create_repo(request: CreateRepo):
    try:
        user = resolve_user(request.user_id)
        if not user:
            raise HTTPException(status_code=403, details="User not found")

        repo_id = create_github_repo(request.repo_name, user.access_token)
        return JSONResponse(
            content={"message": "Repository created successfully", "repo_id": repo_id},
            status_code=201,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")
