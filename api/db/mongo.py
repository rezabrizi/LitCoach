from pymongo import MongoClient
import certifi

from api.config import get_settings

settings = get_settings()

MONGO_DB_URI = f"mongodb+srv://{settings.MONGO_DB_USERNAME}:{settings.MONGO_DB_PASS}@litcoachusers.dxs0t.mongodb.net/?retryWrites=true&w=majority&appName=LitCoachUsers"
client = MongoClient(MONGO_DB_URI, tlsCAFile=certifi.where())
db = client["LITCOACH"]
USERS_COLLECTION = db["users"]
USAGE_COLLECTION = db["usage"]

USERS_COLLECTION.create_index("user_id", unique=True)  # Ensures user_id is unique
USAGE_COLLECTION.create_index("user_id")  # Index for fast lookup
