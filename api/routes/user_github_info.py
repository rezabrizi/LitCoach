from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user
from api.services import get_next_billing_date, has_active_subscription
from api.github import get_user_info_from_github, get_user_github_repos
from api.config import logger

router = APIRouter()


@router.get("/user/github/info")
def user_github_info(github_access_token: str, user_id: str):
    try:
        user = resolve_user(user_id)
        user_info = get_user_info_from_github(github_access_token)
        user_repos = get_user_github_repos(github_access_token)

        user_repos_names_and_ids = [
            {"id": repo["id"], "name": repo["name"]} for repo in user_repos
        ]

        user_data = {
            "github_name": user_info.get("login"),
            "avatar_url": user_info.get("avatar_url"),
            "has_premium": user.has_premium,
            "repos": user_repos_names_and_ids,
        }

        if user.subscription_id and has_active_subscription(user.subscription_id):
            billing_date = get_next_billing_date(user.subscription_id)
            user_data["billing_date"] = billing_date

        return JSONResponse(
            content=user_data,
            status_code=200,
        )

    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
