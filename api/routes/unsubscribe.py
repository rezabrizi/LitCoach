from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.models import UnsubscribeRequest
from api.services import unsubscribe_user
from api.db import resolve_user, update_premium_status
from api.config import logger

router = APIRouter()


@router.post("/unsubscribe")
def unsubscribe(request: UnsubscribeRequest):
    try:
        user = resolve_user(request.user_id)
        if not user or not user.subscription_id:
            raise HTTPException(
                status_code=400, detail="User does not have an active subscription"
            )

        unsubscribe_user(request.user_id, user.subscription_id)

        update_premium_status(
            user_id=user.user_id,
            has_premium=False,
        )

        return JSONResponse(
            status_code=200,
            content={"message": "Successfully unsubscribed from premium"},
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
