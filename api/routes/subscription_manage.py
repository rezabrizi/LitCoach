from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.db import resolve_user_by_google_id
from api.payment import has_active_subscription, create_checkout_session
from api.config import logger

router = APIRouter()


@router.get("/subscription/manage")
def subscription_manage(google_user_id: str):
    try:
        user = resolve_user_by_google_id(google_user_id)
        if not user:
            raise HTTPException(404, detail="User not found")

        if user.subscription_id and has_active_subscription(user.subscription_id):
            return JSONResponse(
                status_code=200,
                content={
                    "customer_portal_url": "https://billing.stripe.com/p/login/test_cNi6oHb8n9jL1JJgzH3Je00",
                },
            )

        url = create_checkout_session(google_user_id=google_user_id)

        return JSONResponse(status_code=200, content={"checkout_url": url})

    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(500, detail=f"Unexpected Error: {str(e)}")
