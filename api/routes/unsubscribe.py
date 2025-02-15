import stripe
from fastapi import APIRouter, HTTPException
from api.config import settings
from api.db.database import get_user_subscription_id

router = APIRouter()
stripe.api_key = settings.STRIPE_API_KEY


@router.post("/unsubscribe")
def unsubscribe(user_id: int):
    try:
        subscription_id = get_user_subscription_id(user_id)
        if not subscription_id:
            raise HTTPException(
                status_code=400, detail="User does not have an active subscription"
            )

        stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)

        return {
            "status": "success",
            "message": "Subscription will cancel at the end of the billing cycle",
        }
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
