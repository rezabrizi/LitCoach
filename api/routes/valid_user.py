import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import user_exists


router = APIRouter()


@router.get("/valid_user")
def valid_user(github_id: int):
    try:
        user = user_exists(github_id)
        if not user:
            raise HTTPException(404, detail="User Does Not Exist")

        response = requests.get(f"https://api.github.com/user/{github_id}")
        response.raise_for_status()

        return JSONResponse(
            content={"message": "User is valid", "user_id": github_id},
            status_code=200,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
