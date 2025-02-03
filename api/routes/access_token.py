from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import user_exists, add_new_user, upsert_user
from api.services import resolve_github_access_token, get_user_info_from_github
from api.models import GithubCode


router = APIRouter()


@router.post("/github_access_token")
def github_callback(github_code: GithubCode):
    try:
        access_token = resolve_github_access_token(github_code.code)
        github_user_info = get_user_info_from_github(access_token)

        user_data = {
            "user_id": int(github_user_info["id"]),
            "username": github_user_info["login"],
            "email": github_user_info.get("email"),
            "avatar_url": github_user_info.get("avatar_url"),
            "access_token": access_token,
            "account_creation_date": datetime.now(timezone.utc),
        }

        existing_user = user_exists(user_id=user_data["user_id"])

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
            upsert_user({"user_id": user_data["user_id"], "access_token": access_token})
            return JSONResponse(
                content={
                    "message": "User already exists; Access Token updated",
                    "user_id": user_data["user_id"],
                },
                status_code=202,
            )

        return JSONResponse(
            content={"message": "User already exists", "user_id": user_data["user_id"]},
            status_code=203,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
