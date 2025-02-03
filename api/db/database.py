from datetime import datetime, timezone, date, timedelta
from api.models.user import User
from pymongo import MongoClient
import certifi
from api.config import settings


MONGO_DB_URI = f"mongodb+srv://{settings.MONGO_DB_USERNAME}:{settings.MONGO_DB_PASS}@litcoachusers.dxs0t.mongodb.net/?retryWrites=true&w=majority&appName=LitCoachUsers"
client = MongoClient(MONGO_DB_URI, tlsCAFile=certifi.where())
db = client["LITCOACH"]
USERS_COLLECTION = db["users"]
USAGE_COLLECTION = db["usage"]


def user_exists(user_id: int):
    user_data = USERS_COLLECTION.find_one({"user_id": user_id})
    if user_data:
        return User(**user_data)
    return None


def add_new_user(
    user_id: str,
    username: str,
    email: str,
    avatar_url: str,
    access_token: str,
    account_creation_date: date,
):
    USERS_COLLECTION.insert_one(
        {
            "user_id": user_id,
            "username": username,
            "email": email,
            "avatar_url": avatar_url,
            "access_token": access_token,
            "is_premium": False,
            "premium_expiry": None,
            "account_creation_date": account_creation_date,
            "tokens": 0,
            "last_reset": account_creation_date,
        }
    )


def upsert_user(user_data: dict):
    USERS_COLLECTION.update_one(
        {"user_id": user_data["user_id"]}, {"$set": user_data}, upsert=True
    )


def is_user_premium(user_id: str) -> bool:
    user = USERS_COLLECTION.find_one({"user_id": user_id})

    if not user:
        return False

    is_premium = user.get("is_premium", False)
    premium_expiry = user.get("premium_expiry")

    if is_premium and premium_expiry:
        premium_expiry_date = datetime.strptime(premium_expiry, "%Y-%m-%dT%H:%M:%S.%fZ")

        if datetime.now(timezone.utc) > premium_expiry_date:
            USERS_COLLECTION.update_one(
                {"user_id": user_id},
                {"$set": {"is_premium": False, "premium_expiry": None}},
            )
            return False

        return True

    return False


def reset_tokens_if_needed(user_id: int):
    user = user_exists(user_id=user_id)

    if not user:
        return

    last_reset = user.last_reset
    now = datetime.now(timezone.utc)

    # Ensure we only reset once per 30 days
    if now - last_reset >= timedelta(days=30):
        USERS_COLLECTION.update_one(
            {"user_id": user_id}, {"$set": {"tokens_used": 0, "last_reset": now}}
        )


def get_current_token_usage(user_id: int):
    user = user_exists(user_id=user_id)
    return user.tokens
