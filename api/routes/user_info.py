from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user
from api.services import get_user_info_from_github, get_user_github_repos

router = APIRouter()


@router.get("/info")
def user_info(user_id: str):
    try:
        user = resolve_user(user_id)
        if not user:
            raise HTTPException(404, detail="User not found")

        user_info = get_user_info_from_github(user.access_token)
        user_repos = get_user_github_repos(user.access_token)

        user_repos_names_and_ids = [
            {"id": repo["id"], "name": repo["name"]} for repo in user_repos
        ]

        user_data = {
            "github_name": user_info.get("login"),
            "avatar_url": user_info.get("avatar_url"),
            "has_premium": user.has_premium,
            "premium_expiry": user.premium_expiry,
            "repos": user_repos_names_and_ids,
        }

        return JSONResponse(
            content=user_data,
            status_code=200,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
