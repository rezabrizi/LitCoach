import stripe
from datetime import datetime, timezone
from fastapi import HTTPException
from api.config import settings

stripe.api_key = settings.STRIPE_API_KEY
WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET
BASE_URL = settings.BASE_URL


def has_active_subscription(subscription_id: str):
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return subscription["status"] == "active"
    except stripe.error.InvalidRequestError:
        return False


def get_next_billing_date(subscription_id: str):
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        if subscription["status"] != "active":
            raise HTTPException(status_code=400, detail="Subscription is not active")

        expiry_timestamp = subscription["current_period_end"]
        expiry_date = datetime.fromtimestamp(expiry_timestamp, timezone.utc)

        return expiry_date.strftime("%Y-%m-%d")
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def unsubscribe_user(user_id: str, subscription_id: str):
    try:
        stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
            metadata={"user_id": user_id},
        )
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def renew_subscription(subscription_id: str):
    try:
        stripe.Subscription.modify(subscription_id, cancel_at_period_end=False)
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def create_checkout_session(user_id: str):
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
            success_url=f"{BASE_URL}/subscription/redirect",
            cancel_url=f"{BASE_URL}/subscription/redirect",
            metadata={"user_id": str(user_id)},
        )

        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def handle_webhook_event(payload: bytes, signature_header: str):
    try:
        event = stripe.Webhook.construct_event(
            payload, signature_header, WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    return event
