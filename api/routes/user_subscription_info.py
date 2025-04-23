from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user_by_google_id
from api.payment import get_next_billing_date, has_active_subscription
from api.config import logger

router = APIRouter()


@router.get("/user/subscription/info")
def user_subscription_info(google_user_id: str):
    try:
        user = resolve_user_by_google_id(google_user_id)
        if not user:
            raise HTTPException(404, detail="User not found")

        user_data = {
            "has_premium": user.has_premium,
        }

        if user.subscription_id and has_active_subscription(user.subscription_id):
            billing_date = get_next_billing_date(user.subscription_id)
            user_data["billing_date"] = billing_date

        return JSONResponse(
            content=user_data,
            status_code=200,
        )

    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
