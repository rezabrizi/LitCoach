from functools import lru_cache
from dotenv import load_dotenv
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.utils.openai_utils import OpenAIClient
from api.routes import authrouter, airouter
from api.config import get_settings


app = FastAPI()
settings = get_settings()

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


@app.get("/health")
def health_check():
    return {"message": "healthy", "?": settings.CUSTOM_VAL}


# Required Endpoints
# Push To Github (Problem, Runtime, Space Required, Github ID)
# Get User Repo List (Github ID)
# Create a new repo(Github ID, repo name)
# Choose repo name (Github ID, repo name)
