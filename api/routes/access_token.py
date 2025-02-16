import uuid
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user_by_github_id, add_new_user, update_user_access_token
from api.services import resolve_github_access_token, get_user_info_from_github
from api.models import GithubCode

router = APIRouter()


@router.post("/github")
def github_auth(request: GithubCode):
    try:
        access_token = resolve_github_access_token(request.code)
        user_info = get_user_info_from_github(access_token)
        user_github_id = int(user_info["id"])

        existing_user = resolve_user_by_github_id(github_id=user_github_id)

        if not existing_user:
            user_id = uuid.uuid4().hex
            add_new_user(
                github_id=user_github_id, access_token=access_token, user_id=user_id
            )
            return JSONResponse(
                content={"message": "User added successfully", "user_id": user_id},
                status_code=201,
            )

        if existing_user.access_token != access_token:
            update_user_access_token(
                user_id=existing_user.user_id, new_access_token=access_token
            )
            return JSONResponse(
                content={
                    "message": "User already exists; Access Token updated",
                    "user_id": existing_user.user_id,
                },
                status_code=202,
            )

        return JSONResponse(
            content={"message": "User already exists"},
            status_code=203,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
