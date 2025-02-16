import stripe
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from api.db.database import update_premium_status
from api.config import settings

router = APIRouter()
stripe.api_key = settings.STRIPE_API_KEY
WEBHOOK_SECRET = settings.STRIPE_WEBHOOK_SECRET


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "customer.subscription.created":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        subscription_id = session.get("id")
        expiry_date = datetime.now(timezone.utc) + timedelta(days=30)
        update_premium_status(user_id, True, expiry_date, subscription_id)

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user_id = subscription["metadata"]["user_id"]
        update_premium_status(user_id, False, None)

    return {"status": "success"}
