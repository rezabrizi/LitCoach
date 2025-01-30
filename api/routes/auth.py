from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.services.database import user_exists, add_new_user, upsert_user
from api.utils.github import resolve_github_access_token, get_user_info_from_github

from pydantic import BaseModel


class GithubCode(BaseModel):
    code: str


router = APIRouter()


@router.post("/github_access_token")
def github_callback(github_code: GithubCode):
    try:
        print(github_code.code)
        # Step 1: Resolve the GitHub access token
        access_token = resolve_github_access_token(github_code.code)

        # Step 2: Fetch GitHub user info
        github_user_info = get_user_info_from_github(access_token)
        user_id = int(github_user_info["id"])
        username = github_user_info["login"]
        email = github_user_info.get("email")
        avatar_url = github_user_info.get("avatar_url")

        # Step 3: Check if user exists or create a new user
        existing_user = user_exists(user_id=user_id)
        if not existing_user:
            # Insert the new user if not found
            add_new_user(
                user_id=user_id,
                username=username,
                email=email,
                avatar_url=avatar_url,
                access_token=access_token,
            )
            return JSONResponse(
                content={"message": "User added successfully", "user_id": user_id},
                status_code=201,
            )
        elif existing_user.access_token != access_token:
            upsert_user({"user_id": user_id, "access_token": access_token})
            return JSONResponse(
                content={
                    "message": "User already exists; Access Token updated ",
                    "user_id": user_id,
                },
                status_code=202,
            )

        return JSONResponse(
            content={"message": "User already exists", "user_id": user_id},
            status_code=203,
        )

    except HTTPException as e:
        raise e

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}",
        )
