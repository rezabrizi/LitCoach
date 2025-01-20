from fastapi import APIRouter, HTTPException
from api.github import fetch_github_user_repos

router = APIRouter()

@router.get("/user-repos")
async def get_user_repos(access_token: str):
    try:
        return await fetch_github_user_repos(access_token)
    except Exception as e:
        status_code = getattr(e.response, "status_code", 500)
        exception_detail = getattr(e, "detail", str(e))
        raise HTTPException(status_code=status_code, detail=exception_detail)