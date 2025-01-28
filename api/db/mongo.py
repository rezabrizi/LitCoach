from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()
MONGO_DB_USER = os.getenv("MONGODB_USERNAME")
MONGO_DB_PASS = os.getenv("MONGODB_PASSWORD")
MONGO_DB_URI = f"mongodb+srv://{MONGO_DB_USER}:{MONGO_DB_PASS}@litcoachusers.dxs0t.mongodb.net/?retryWrites=true&w=majority&appName=LitCoachUsers"
client = MongoClient(MONGO_DB_URI)
db = client["LITCOACH"]
USERS_COLLECTION = db["users"]
USAGE_COLLECTION = db["usage"]
