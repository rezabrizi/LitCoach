from dotenv import load_dotenv
import os
import requests

from fastapi import FastAPI, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi


from api.utils.openai_utils import OpenAIClient
from api.routes import authrouter, airouter

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(authrouter, prefix="/auth", tags=["auth"])
app.include_router(airouter, prefix="/ai", tags=["auth"])
# app.include_router(user.router, prefix="/auth", tags=["auth"])


def get_openai_client() -> OpenAIClient:
    return OpenAIClient(
        API_KEY=os.getenv("OPENAI_LITCOACH_KEY"),
        project_id="proj_tBo3vZb4T5ghUKf96NEzuQNM",
    )


MONGO_DB_USER = os.getenv("MONGODB_USERNAME")
MONGO_DB_PASS = os.getenv("MONGODB_PASSWORD")
MONGO_DB_URI = f"mongodb+srv://{MONGO_DB_USER}:{MONGO_DB_PASS}@litcoachusers.dxs0t.mongodb.net/?retryWrites=true&w=majority&appName=LitCoachUsers"
OPENAI_KEY = os.getenv("OPENAI_LITCOACH_KEY")
PROJECT_ID = "proj_tBo3vZb4T5ghUKf96NEzuQNM"
OPEN_AI_CLIENT = OpenAIClient(API_KEY=OPENAI_KEY, project_id=PROJECT_ID)
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")


@app.get("/health")
def health_check():
    return {"message": "healthy"}


# @app.post("/upsert_user")


# /pushToGithub
# github id

# /getRepoList
#

# /createnewRepo

# /user
