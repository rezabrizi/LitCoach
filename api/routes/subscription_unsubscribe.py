from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.models import UnsubscribeRequest
from api.payment import unsubscribe_user
from api.db import (
    resolve_user_by_legacy_user_id,
    resolve_user_by_google_id,
    update_premium_status,
)
from api.config import logger

router = APIRouter()


@router.post("/subscription/unsubscribe")
def subscription_unsubscribe(request: UnsubscribeRequest):
    try:
        user = resolve_user_by_legacy_user_id(
            request.user_id
        ) or resolve_user_by_google_id(request.google_user_id)
        if not user or not user.subscription_id:
            raise HTTPException(
                status_code=400, detail="User does not have an active subscription"
            )

        unsubscribe_user(
            legacy_user_id=request.user_id,
            google_user_id=request.google_user_id,
            subscription_id=user.subscription_id,
        )

        update_premium_status(
            legacy_user_id=request.user_id,
            google_user_id=request.google_user_id,
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
