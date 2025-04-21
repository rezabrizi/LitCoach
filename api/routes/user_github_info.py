from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.github import get_user_info_from_github, get_user_github_repos
from api.config import logger

router = APIRouter()


@router.get("/user/github/info")
def user_github_info(github_access_token: str):
    try:
        user_github_details = get_user_info_from_github(github_access_token)
        user_github_repositories = get_user_github_repos(github_access_token)

        user_repos_names_and_ids = [
            {"id": repo["id"], "name": repo["name"]}
            for repo in user_github_repositories
        ]

        user_data = {
            "github_name": user_github_details.get("login"),
            "avatar_url": user_github_details.get("avatar_url"),
            "repos": user_repos_names_and_ids,
        }

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
