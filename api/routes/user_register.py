from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import (
    resolve_user,
    add_new_user,
    resolve_user_by_google_id,
    add_user_google_id,
)
from api.models import RegisterUser
from api.config import logger

router = APIRouter()


@router.post("/user/register")
def register_user(request: RegisterUser):
    try:
        # Check if user already exists with Google ID
        user = resolve_user_by_google_id(request.google_user_id)
        if user:
            return JSONResponse(
                content={"message": "User already exists"}, status_code=200
            )

        # Try to find and migrate existing user
        user = resolve_user(request.old_user_id)
        if user:
            add_user_google_id(request.old_user_id, request.google_user_id)
            return JSONResponse(
                content={"message": "User migrated successfully"}, status_code=200
            )

        # Create new user if not found
        add_new_user(user_id=request.google_user_id, github_id=None, access_token=None)
        return JSONResponse(
            content={"message": "User added successfully"}, status_code=201
        )

    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
