from fastapi import APIRouter, HTTPException

from api.services.database import user_exists
from api.utils.github import get_user_repos


router = APIRouter()


@router.get("/repos")
def get_all_available_repos(github_id: int):

    try:
        print(github_id)
        user = user_exists(github_id)
        print(user)
        if not user:
            raise HTTPException(403, detail="User DNE")

        user_repos = get_user_repos(user.access_token)

        user_repos_names_and_ids = [
            {"id": repo["id"], "name": repo["name"]} for repo in user_repos
        ]

        return user_repos_names_and_ids
    except HTTPException as e:
        raise e
