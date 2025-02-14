from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user
from api.services import get_user_repos

router = APIRouter()


@router.get("/repos")
def get_all_available_repos(github_id: int):
    try:
        user = resolve_user(github_id)
        if not user:
            raise HTTPException(404, detail="User not found")

        user_repos = get_user_repos(user.access_token)

        user_repos_names_and_ids = [
            {"id": repo["id"], "name": repo["name"]} for repo in user_repos
        ]

        return JSONResponse(
            content={"repos": user_repos_names_and_ids},
            status_code=200,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
