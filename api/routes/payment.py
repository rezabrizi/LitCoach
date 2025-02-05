# from fastapi import APIRouter, HTTPException, Request
# from datetime import datetime, timezone, timedelta
# import stripe

# from api.db.database import upsert_user
# from api.config import settings

# router = APIRouter()

# stripe.api_key = settings.STRIPE_API_KEY


# @router.post("/subscribe")
# def create_checkout_session(user_id: int):
#     try:
#         session = stripe.checkout.Session.create(
#             payment_method_types=["card"],
#             line_items=[
#                 {
#                     "price_data": {
#                         "currency": "usd",
#                         "product_data": {"name": "LitCoach Premium Subscription"},
#                         "unit_amount": 199,  # $9.99
#                         "recurring": {"interval": "month"},
#                     },
#                     "quantity": 1,
#                 },
#             ],
#             mode="subscription",
#             success_url="https://www.leetcode.com/",
#             cancel_url="https://www.leetcode.com/",
#             metadata={"user_id": user_id},
#         )

#         return {"url": session.url}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# @router.post("/webhook")
# async def stripe_webhook(request: Request):
#     payload = await request.body()
#     sig_header = request.headers.get("Stripe-Signature")
#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
#         )
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid payload")
#     except stripe.error.SignatureVerificationError:
#         raise HTTPException(status_code=400, detail="Invalid signature")
#     if event["type"] == "checkout.session.completed":
#         session = event["data"]["object"]
#         user_id = int(session["metadata"]["user_id"])

#         expiry_date = datetime.now(timezone.utc) + timedelta(days=30)

#         upsert_user(
#             {
#                 "user_id": user_id,
#                 "is_premium": True,
#                 "premium_expiry": expiry_date.isoformat(),
#             }
#         )

#     return {"status": "success"}
