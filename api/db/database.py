from datetime import datetime, timezone, timedelta
from api.models.user import User
from pymongo import MongoClient
import certifi
from api.config import settings

client = MongoClient(settings.MONGO_DB_URI, tlsCAFile=certifi.where())
DB = client["LITCOACH"]
USERS_COLLECTION = DB["users"]


def resolve_user(user_id: str) -> User | None:
    user_data = USERS_COLLECTION.find_one({"user_id": user_id})
    if not user_data:
        return None

    return User(**user_data)


def resolve_user_by_google_id(google_user_id: str) -> User | None:
    user_data = USERS_COLLECTION.find_one({"google_user_id": google_user_id})
    if not user_data:
        return None

    return User(**user_data)


def resolve_user_by_github_id(github_id: str) -> User | None:
    user_data = USERS_COLLECTION.find_one({"github_id": github_id})
    if not user_data:
        return None

    return User(**user_data)


def add_new_user(user_id: str, github_id: str, access_token: str):
    account_creation_date = datetime.now(timezone.utc).isoformat()
    USERS_COLLECTION.insert_one(
        {
            "user_id": user_id,
            "github_id": github_id,
            "access_token": access_token,
            "has_premium": False,
            "tokens_used_monthly": 0,
            "last_monthly_token_reset": account_creation_date,
            "tokens_used_in_past_5_hours": 0,
            "last_5_hour_cooldown_reset": account_creation_date,
        }
    )


def add_user_google_id(user_id: str, google_user_id: str):
    user = resolve_user(user_id)
    if not user:
        return

    USERS_COLLECTION.update_one(
        {"user_id": user.user_id},
        {"$set": {"google_user_id": google_user_id}},
    )


def update_user_tokens(user_id: str, new_tokens: int):
    user = resolve_user(user_id)
    if not user:
        return

    user.tokens_used_in_past_5_hours += new_tokens
    user.tokens_used_monthly += new_tokens
    USERS_COLLECTION.update_one(
        {"user_id": user.user_id},
        {
            "$set": {
                "tokens_used_in_past_5_hours": user.tokens_used_in_past_5_hours,
                "tokens_used_monthly": user.tokens_used_monthly,
            }
        },
    )


def update_user_access_token_and_uuid(
    github_id: str, new_uuid: str, new_access_token: str
):
    user = resolve_user_by_github_id(github_id)
    if not user:
        return

    USERS_COLLECTION.update_one(
        {"github_id": github_id},
        {"$set": {"user_id": new_uuid, "access_token": new_access_token}},
    )


def reset_tokens_if_needed(user: User):
    now = datetime.now(timezone.utc)
    if now - datetime.fromisoformat(user.last_monthly_token_reset) >= timedelta(
        days=30
    ):
        USERS_COLLECTION.update_one(
            {"user_id": user.user_id},
            {
                "$set": {
                    "tokens_used_monthly": 0,
                    "last_monthly_token_reset": now.isoformat(),
                }
            },
        )
    if now - datetime.fromisoformat(user.last_5_hour_cooldown_reset) >= timedelta(
        hours=5
    ):
        USERS_COLLECTION.update_one(
            {"user_id": user.user_id},
            {
                "$set": {
                    "tokens_used_in_past_5_hours": 0,
                    "last_5_hour_cooldown_reset": now.isoformat(),
                }
            },
        )


def update_premium_status(
    user_id: str,
    has_premium: bool,
    subscription_id: str = None,
):
    data = {
        "has_premium": has_premium,
    }

    if subscription_id:
        data["subscription_id"] = subscription_id

    USERS_COLLECTION.update_one(
        {"user_id": user_id},
        {"$set": data},
    )


def get_user_subscription_id(user_id: str):
    user = USERS_COLLECTION.find_one({"user_id": user_id})
    return user.get("subscription_id") if user else None
