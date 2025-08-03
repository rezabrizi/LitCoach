from fastapi import APIRouter, Request
from api.payment import handle_webhook_event
from api.db import update_premium_status, update_premium_status_by_subscription_id

router = APIRouter()


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    event = handle_webhook_event(payload, sig_header)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        google_user_id = session.get("metadata", {}).get("google_user_id")

        if user_id or google_user_id:
            subscription_id = session.get("subscription")
            update_premium_status(
                legacy_user_id=user_id,
                google_user_id=google_user_id,
                has_premium=True,
                subscription_id=subscription_id,
            )

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user_id = subscription.get("metadata", {}).get("user_id")
        google_user_id = subscription.get("metadata", {}).get("google_user_id")
        if user_id or google_user_id:
            update_premium_status(
                legacy_user_id=user_id,
                google_user_id=google_user_id,
                has_premium=False,
            )

    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        user_id = subscription.get("metadata", {}).get("user_id")
        cancel_at_period_end = subscription.get("cancel_at_period_end", False)
        update_premium_status_by_subscription_id(
            subscription_id=subscription.get("id"),
            has_premium=not cancel_at_period_end,
        )
