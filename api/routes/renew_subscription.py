from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.services import renew_subscription
from api.models import SubscribeRequest
from api.db import resolve_user, update_premium_status

router = APIRouter()


@router.post("/renew")
def subscribe(request: SubscribeRequest):
    try:
        user = resolve_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        renew_subscription(user.subscription_id)
        update_premium_status(user.user_id, True)

        return JSONResponse(
            status_code=200,
            content={"message": "Subscription renewed successfully"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
