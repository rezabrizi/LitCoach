from fastapi import APIRouter, HTTPException
from api.github import does_repo_exist

router = APIRouter()

@router.get("/repo-exist")
async def check_repository_existence(repo: str, access_token: str):
    try:
        return await does_repo_exist(repo, access_token)
    except Exception as e:
        status_code = getattr(e.response, "status_code", 500)
        exception_detail = getattr(e, "detail", str(e))
        raise HTTPException(status_code=status_code, detail=exception_detail)