import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import user_exists


router = APIRouter()


@router.get("/valid_user")
def valid_user(github_id: int):
    try:
        if not user_exists(github_id):
            raise HTTPException(404, detail="User Does Not Exist")

        return JSONResponse(
            content={"message": "User is valid"},
            status_code=200,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
