import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import (
    resolve_user_by_github_id,
    add_new_user,
    update_user_access_token_and_uuid,
)
from api.services import resolve_github_access_token, get_user_info_from_github
from api.models import GithubAccessTokenRequest
from api.config import logger

router = APIRouter()


@router.post("/api/github/access_token")
def github_access_token(request: GithubAccessTokenRequest):
    try:
        github_access_token = resolve_github_access_token(request.github_code)

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
