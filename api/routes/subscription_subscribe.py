from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.services import create_checkout_session
from api.models import SubscribeRequest
from api.db import resolve_user
from api.config import logger

router = APIRouter()


@router.post("/subscription/subscribe")
def subscribe(request: SubscribeRequest):
    try:
        user = resolve_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        url = create_checkout_session(user.user_id)

        return JSONResponse(
            status_code=200,
            content={"url": url},
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
