from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.github import resolve_github_access_token
from api.models import GithubCode
from api.config import logger

router = APIRouter()


@router.post("/github/access-token")
def github_access_token(request: GithubCode):
    try:
        github_access_token = resolve_github_access_token(request.code)

        return JSONResponse(
            content={
                "message": "Access token resolved successfully",
                "github_access_token": github_access_token,
            },
            status_code=200,
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
