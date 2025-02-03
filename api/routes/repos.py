from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import user_exists
from api.services import get_user_repos


router = APIRouter()


@router.get("/repos")
def get_all_available_repos(github_id: int):
    try:
        user = user_exists(github_id)
        if not user:
            raise HTTPException(403, detail="User Does Not Exist")

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