from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user, add_new_user, update_user_access_token
from api.services import resolve_github_access_token, get_user_info_from_github
from api.models import GithubCode

router = APIRouter()


@router.post("/github_access_token")
def github_access_token(request: GithubCode):
    try:
        access_token = resolve_github_access_token(request.code)
        github_user_info = get_user_info_from_github(access_token)

        user_data = {
            "user_id": int(github_user_info["id"]),
            "access_token": access_token,
            "account_creation_date": datetime.now(timezone.utc),
        }

        existing_user = resolve_user(user_id=user_data["user_id"])

        if not existing_user:
            add_new_user(**user_data)
            return JSONResponse(
                content={
                    "message": "User added successfully",
                    "user_id": user_data["user_id"],
                },
                status_code=201,
            )

        if existing_user.access_token != access_token:
            update_user_access_token(
                user_id=user_data["user_id"], access_token=access_token
            )
            return JSONResponse(
                content={
                    "message": "User already exists; Access Token updated",
                    "user_id": user_data["user_id"],
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
