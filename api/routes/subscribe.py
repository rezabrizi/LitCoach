import stripe
from fastapi import APIRouter, HTTPException
from api.config import settings
from api.models import SubscribeRequest

router = APIRouter()
stripe.api_key = settings.STRIPE_API_KEY


@router.post("/subscribe")
def subscribe(request: SubscribeRequest):
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": "LitCoach Premium Subscription"},
                        "unit_amount": 199,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url="https://www.leetcode.com/",
            cancel_url="https://www.leetcode.com/",
            metadata={"user_id": str(request.user_id)},
        )

        return {"url": session.url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
