from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.payment import renew_subscription
from api.models import SubscribeRequest
from api.db import (
    resolve_user_by_legacy_user_id,
    resolve_user_by_google_id,
    update_premium_status,
)
from api.config import logger

router = APIRouter()


@router.post("/subscription/renew")
def subscription_renew(request: SubscribeRequest):
    try:
        user = resolve_user_by_legacy_user_id(
            request.user_id
        ) or resolve_user_by_google_id(request.google_user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        renew_subscription(user.subscription_id)
        update_premium_status(
            legacy_user_id=request.user_id,
            google_user_id=request.google_user_id,
            has_premium=True,
            subscription_id=user.subscription_id,
        )

        return JSONResponse(
            status_code=200,
            content={"message": "Subscription renewed successfully"},
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
