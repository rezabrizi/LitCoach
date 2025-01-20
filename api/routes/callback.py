from fastapi import APIRouter, HTTPException, status
from api.github import github_auth_callback

router = APIRouter()

@router.get("/callback")
async def github_callback(code: str):
    try:
        return await github_auth_callback(code)
    except Exception as e:
        status_code = getattr(e.response, "status_code", status.HTTP_500_INTERNAL_SERVER_ERROR)
        exception_detail = getattr(e, "detail", str(e))
        raise HTTPException(status_code=status_code, detail=exception_detail)