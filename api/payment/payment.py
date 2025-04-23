import stripe
from datetime import datetime, timezone
from fastapi import HTTPException
from api.config import settings

stripe.api_key = settings.STRIPE_API_KEY
WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET

CHECKOUT_IMAGE_URL = "https://raw.githubusercontent.com/rezabrizi/LitCoach/main/assets/small-promo-tile.png"


def has_active_subscription(subscription_id: str) -> bool:
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        return subscription["status"] == "active"
    except stripe.error.InvalidRequestError:
        return False


def get_next_billing_date(subscription_id: str) -> str:
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


def unsubscribe_user(
    subscription_id: str, legacy_user_id: str = None, google_user_id: str = None
):
    try:
        stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=True,
            metadata={
                "user_id": legacy_user_id,
                "google_user_id": google_user_id,
            },
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


def create_checkout_session(
    legacy_user_id: str = None, google_user_id: str = None
) -> str:
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "LitCoach Premium Subscription",
                            "images": [CHECKOUT_IMAGE_URL],
                        },
                        "unit_amount": 199,
                        "recurring": {"interval": "month"},
                    },
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url="https://leetcode.com/problems/two-sum",
            cancel_url="https://leetcode.com/problems/two-sum",
            metadata={
                "user_id": legacy_user_id,
                "google_user_id": google_user_id,
            },
        )

        return session.url
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
