from datetime import datetime, timezone, date, timedelta
from api.models.user import User
from pymongo import MongoClient
import certifi
from api.config import settings, logger


MONGO_DB_URI = f"mongodb+srv://{settings.MONGO_DB_USERNAME}:{settings.MONGO_DB_PASS}@litcoachusers.dxs0t.mongodb.net/?retryWrites=true&w=majority&appName=LitCoachUsers"
client = MongoClient(MONGO_DB_URI, tlsCAFile=certifi.where())
db = client["LITCOACH"]
USERS_COLLECTION = db["users"]
USAGE_COLLECTION = db["usage"]


def user_exists(user_id: int):
    user_data = USERS_COLLECTION.find_one({"user_id": user_id})
    if user_data:
        if "account_creation_date" in user_data:
            user_data["account_creation_date"] = user_data[
                "account_creation_date"
            ].replace(tzinfo=timezone.utc)
        if "last_monthly_token_reset" in user_data:
            user_data["last_monthly_token_reset"] = user_data[
                "last_monthly_token_reset"
            ].replace(tzinfo=timezone.utc)
        if "last_cooldown_reset" in user_data:
            user_data["last_cooldown_reset"] = user_data["last_cooldown_reset"].replace(
                tzinfo=timezone.utc
            )
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
            "tokens_used_monthly": 0,
            "last_monthly_token_reset": account_creation_date,
            "tokens_used_in_past_5_hours": 0,
            "last_cooldown_reset": account_creation_date,
        }
    )


def update_user_tokens(user_id: int, new_tokens: int):
    user = user_exists(user_id)
    if not user:
        return
    user.tokens_used_in_past_5_hours += new_tokens
    user.tokens_used_monthly += new_tokens
    upsert_user(
        {
            "user_id": user.user_id,
            "tokens_used_in_past_5_hours": user.tokens_used_in_past_5_hours,
            "tokens_used_monthly": user.tokens_used_monthly,
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

    last_monthly_reset = user.last_monthly_token_reset
    last_cooldown_reset = user.last_cooldown_reset

    logger.debug(f"last cooldown time {last_cooldown_reset}")
    now = datetime.now(timezone.utc)
    logger.debug(f"now {now}")
    # Ensure we only reset once per 30 days
    if now - last_monthly_reset >= timedelta(days=30):
        USERS_COLLECTION.update_one(
            {"user_id": user_id},
            {"$set": {"tokens_used_monthly": 0, "last_monthly_token_reset": now}},
        )

    if now - last_cooldown_reset >= timedelta(minutes=1):
        USERS_COLLECTION.update_one(
            {"user_id": user_id},
            {"$set": {"tokens_used_in_past_5_hours": 0, "last_cooldown_reset": now}},
        )


def get_monthly_token_usage(user_id: int):
    user = user_exists(user_id=user_id)
    return user.tokens_used_monthly


def get_5h_token_usage(user_id: int):
    user = user_exists(user_id=user_id)
    return user.tokens_used_in_past_5_hours


def can_user_use_ai(user_id: int):
    reset_tokens_if_needed(user_id=user_id)
    if is_user_premium(user_id=user_id):
        return True

    if get_5h_token_usage(user_id=user_id) >= 1500:
        return False

    # if get_monthly_token_usage(user_id=user_id) >= 30000:
    #     return False

    return True
