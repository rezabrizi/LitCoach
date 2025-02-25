from fastapi import APIRouter, Request
from api.services import handle_webhook_event
from api.db import update_premium_status

router = APIRouter()


@router.post("/webhook")
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
