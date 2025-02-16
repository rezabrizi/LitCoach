import stripe
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.config import settings
from api.db.database import resolve_user
from api.models import UnsubscribeRequest

router = APIRouter()
stripe.api_key = settings.STRIPE_API_KEY


@router.post("/unsubscribe")
def unsubscribe(request: UnsubscribeRequest):
    try:
        user = resolve_user(request.user_id)
        if not user.subscription_id:
            raise HTTPException(
                status_code=400, detail="User does not have an active subscription"
            )

        stripe.Subscription.modify(
            user.subscription_id,
            cancel_at_period_end=True,
            metadata={"user_id": request.user_id}
        )

        return JSONResponse(
            status_code=200,
            content={
                "message": "Subscription will be cancelled at the end of the billing period"
            },
        )
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
