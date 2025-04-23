from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.github import create_github_repo
from api.db import resolve_user_by_legacy_user_id
from api.models import CreateRepo
from api.config import logger

router = APIRouter()


@router.post("/user/github/repo")
def user_github_repo(request: CreateRepo):
    try:
        user = None
        if request.user_id:
            user = resolve_user_by_legacy_user_id(request.user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

        access_token = user.access_token if user else request.github_access_token
        if not access_token:
            raise HTTPException(status_code=400, detail="Access token is required")

        repo_id = create_github_repo(
            repo_name=request.repo_name,
            access_token=access_token,
            tags=["data-structures-and-algorithms", "leetcode-solutions", "litcoach"],
        )

        return JSONResponse(
            content={"message": "Repository created successfully", "repo_id": repo_id},
            status_code=201,
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(status_code=500, detail=f"Unexpected Error: {str(e)}")
