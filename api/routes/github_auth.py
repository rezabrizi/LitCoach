import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import (
    resolve_user_by_github_id,
    add_new_user,
    update_user_access_token_and_uuid,
)
from api.services import resolve_github_access_token, get_user_info_from_github
from api.models import GithubCode
from api.config import logger

router = APIRouter()


@router.post("/auth/github")
def github_auth(request: GithubCode):
    try:
        access_token = resolve_github_access_token(request.code)
        user_info = get_user_info_from_github(access_token)
        user_github_id = int(user_info["id"])
        user_id = uuid.uuid4().hex

        existing_user = resolve_user_by_github_id(github_id=user_github_id)

        if not existing_user:
            add_new_user(
                github_id=user_github_id, access_token=access_token, user_id=user_id
            )
            return JSONResponse(
                content={"message": "User added successfully", "user_id": user_id},
                status_code=201,
            )

        if existing_user.access_token != access_token:
            update_user_access_token_and_uuid(
                github_id=user_github_id,
                new_uuid=user_id,
                new_access_token=access_token,
            )
            return JSONResponse(
                content={
                    "message": "User already exists; Access Token updated",
                    "user_id": user_id,
                },
                status_code=202,
            )

        return JSONResponse(
            content={"message": "User already exists"},
            status_code=203,
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
