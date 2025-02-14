from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user


router = APIRouter()


@router.get("/valid_user")
def valid_user(github_id: int):
    try:
        if not resolve_user(github_id):
            raise HTTPException(404, detail="User not found")

        return JSONResponse(
            content={"message": "User is valid"},
            status_code=200,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
