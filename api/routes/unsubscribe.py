import stripe
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.config import settings
from api.db.database import get_user_subscription_id
from api.models import UnsubscribeRequest

router = APIRouter()
stripe.api_key = settings.STRIPE_API_KEY


@router.post("/unsubscribe")
def unsubscribe(request: UnsubscribeRequest):
    try:
        subscription_id = get_user_subscription_id(request.user_id)
        if not subscription_id:
            raise HTTPException(
                status_code=400, detail="User does not have an active subscription"
            )

        stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)

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
