from datetime import datetime, timezone
from api.models.user import User
from api.db.mongo import USERS_COLLECTION, USAGE_COLLECTION


def user_exists(user_id: str):
    user_data = USERS_COLLECTION.find_one({"user_id": user_id})
    print(user_data)
    if user_data:
        return User(**user_data)
    return None


def add_new_user(
    user_id: str, username: str, email: str, avatar_url: str, access_token: str
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
        }
    )


def upsert_user(user_data: dict):
    USERS_COLLECTION.update_one(
        {"user_id": user_data["user_id"]}, {"$set": user_data}, upsert=True
    )


def is_user_premium(user_id: str) -> bool:
    """
    Check if a user is a premium user and ensure their status is updated if expired.

    :param user_id: The ID of the user to check.
    :param users_collection: The MongoDB collection for users.
    :return: True if the user is a valid premium user, False otherwise.
    """
    # Fetch the user's premium status from the database
    user = USERS_COLLECTION.find_one({"user_id": user_id})

    if not user:
        return False

    # Extract premium status
    is_premium = user.get("is_premium", False)
    premium_expiry = user.get("premium_expiry")

    # Check if the premium status has expired
    if is_premium and premium_expiry:
        # Convert expiry to a datetime object
        premium_expiry_date = datetime.strptime(premium_expiry, "%Y-%m-%dT%H:%M:%S.%fZ")

        # Check if the premium period has expired
        if datetime.now(timezone.utc) > premium_expiry_date:
            # Premium has expired, update the user's status to false
            USERS_COLLECTION.update_one(
                {"user_id": user_id},
                {"$set": {"is_premium": False, "premium_expiry": None}},
            )
            return False

        return True

    return False


def get_monthly_usage(user_id: str) -> int:
    """
    Calculate the total token usage for a user in the current calendar month.

    :param user_id: The ID of the user to calculate usage for.
    :return: Total tokens used by the user in the current month.
    """
    now = datetime.now(timezone.utc)

    # Calculate the first and last day of the current month
    start_of_month = datetime(now.year, now.month, 1)
    if now.month == 12:
        end_of_month = datetime(now.year + 1, 1, 1)
    else:
        end_of_month = datetime(now.year, now.month + 1, 1)

    # MongoDB aggregation pipeline
    pipeline = [
        {
            "$match": {
                "user_id": user_id,  # Filter by user ID
                "timestamp": {
                    "$gte": start_of_month,
                    "$lt": end_of_month,
                },  # Filter by current month
            }
        },
        {
            "$group": {
                "_id": None,  # Group all matching documents
                "total_tokens": {"$sum": "$tokens"},  # Sum the tokens field
            }
        },
    ]
    result = list(USAGE_COLLECTION.aggregate(pipeline))

    # Return the total tokens or 0 if no usage is found
    if result:
        return result[0]["total_tokens"]
    return 0
