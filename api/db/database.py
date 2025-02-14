from datetime import datetime, timezone, date, timedelta
from api.models.user import User
from pymongo import MongoClient
import certifi
from api.config import settings

client = MongoClient(settings.MONGO_DB_URI, tlsCAFile=certifi.where())
DB = client["LITCOACH"]
USERS_COLLECTION = DB["users"]

MONTHLY_LIMIT = 2000000
FIVE_HOUR_LIMIT = 66666


def resolve_user(user_id: int) -> User | None:
    user_data = USERS_COLLECTION.find_one({"user_id": user_id})
    if not user_data:
        return None

    for field in [
        "account_creation_date",
        "last_monthly_token_reset",
        "last_5_hour_cooldown_reset",
    ]:
        if field in user_data:
            user_data[field] = user_data[field].replace(tzinfo=timezone.utc)

    return User(**user_data)


def add_new_user(
    user_id: str,
    access_token: str,
    account_creation_date: date,
):
    USERS_COLLECTION.insert_one(
        {
            "user_id": user_id,
            "access_token": access_token,
            "is_premium": False,
            "premium_expiry": None,
            "account_creation_date": account_creation_date,
            "tokens_used_monthly": 0,
            "last_monthly_token_reset": account_creation_date,
            "tokens_used_in_past_5_hours": 0,
            "last_5_hour_cooldown_reset": account_creation_date,
        }
    )


def update_user_tokens(user_id: int, new_tokens: int):
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


def update_user_access_token(user_id: int, access_token: str):
    user = resolve_user(user_id)
    if not user:
        return

    USERS_COLLECTION.update_one(
        {"user_id": user_id},
        {"$set": {"access_token": access_token}},
    )


def is_user_premium(user_id: str) -> bool:
    user = USERS_COLLECTION.find_one({"user_id": user_id})
    if not user or not user.get("is_premium"):
        return False

    premium_expiry = user.get("premium_expiry")
    if premium_expiry and datetime.now(timezone.utc) > datetime.fromisoformat(
        premium_expiry
    ):
        USERS_COLLECTION.update_one(
            {"user_id": user_id},
            {"$set": {"is_premium": False, "premium_expiry": None}},
        )
        return False

    return True


def reset_tokens_if_needed(user: User):
    now = datetime.now(timezone.utc)
    if now - user.last_monthly_token_reset >= timedelta(days=30):
        USERS_COLLECTION.update_one(
            {"user_id": user.user_id},
            {
                "$set": {
                    "tokens_used_monthly": 0,
                    "last_monthly_token_reset": now,
                }
            },
        )
    if now - user.last_5_hour_cooldown_reset >= timedelta(hours=5):
        USERS_COLLECTION.update_one(
            {"user_id": user.user_id},
            {
                "$set": {
                    "tokens_used_in_past_5_hours": 0,
                    "last_5_hour_cooldown_reset": now,
                }
            },
        )


def can_user_use_ai(user_id: int) -> tuple[bool, str | None]:
    user = resolve_user(user_id)
    if not user:
        return False, "User not found"

    reset_tokens_if_needed(user)
    if is_user_premium(user_id):
        return True, None

    if user.tokens_used_in_past_5_hours >= FIVE_HOUR_LIMIT:
        return False, "Exceeded 5-hour limit"
    if user.tokens_used_monthly >= MONTHLY_LIMIT:
        return False, "Exceeded monthly limit"

    return True, None
