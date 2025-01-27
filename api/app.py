from dotenv import load_dotenv
import os
import requests

from fastapi import FastAPI, HTTPException, status, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

load_dotenv()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GithubCode(BaseModel):
    code: str

# class User(BaseModel):
#     email: str
#     access_token: str

@app.get("/health")
def health_check():
    return {"message": "healthy"}

@app.post("/github_access_token")
def github_callback(github_code: GithubCode):
    response = requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": github_code.code,
        },
        headers={"Accept": "application/json"}
    )

    try:
        response.raise_for_status()
        access_token = response.json().get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail=response.json().get("error_description")
            )

        return {"access_token": access_token}
    
    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500),
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# @app.post("/upsert_user")


