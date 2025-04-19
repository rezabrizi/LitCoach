from fastapi import APIRouter, Request
from api.payment import handle_webhook_event
from api.db import update_premium_status

router = APIRouter()


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    event = handle_webhook_event(payload, sig_header)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            subscription_id = session.get("subscription")
            update_premium_status(
                user_id=user_id, has_premium=True, subscription_id=subscription_id
            )

    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        user_id = subscription.get("metadata", {}).get("user_id")

        if user_id:
            is_active = subscription["status"] in ["active", "trialing"]
            update_premium_status(
                user_id=user_id,
                has_premium=is_active,
                subscription_id=subscription["id"],
            )

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user_id = subscription.get("metadata", {}).get("user_id")

        if user_id:
            update_premium_status(
                user_id=user_id, has_premium=False, subscription_id=None
            )
