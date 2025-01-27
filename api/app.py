from dotenv import load_dotenv
import os
import requests

from fastapi import FastAPI, HTTPException, status, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

from .utils import (
    get_user_info_from_github,
    user_has_enough_tokens,
    is_user_premium,
    get_token_count,
)

from .openai_utils import OpenAIClient, get_open_ai_prompt

load_dotenv()

MONGO_DB_USER = os.getenv("MONGODB_USERNAME")
MONGO_DB_PASS = os.getenv("MONGODB_PASSWORD")
MONGO_DB_URI = f"mongodb+srv://{MONGO_DB_USER}:{MONGO_DB_PASS}@litcoachusers.dxs0t.mongodb.net/?retryWrites=true&w=majority&appName=LitCoachUsers"
OPENAI_KEY = os.getenv("OPENAI_LITCOACH_KEY")
PROJECT_ID = "proj_tBo3vZb4T5ghUKf96NEzuQNM"
OPEN_AI_CLIENT = OpenAIClient(API_KEY=OPENAI_KEY, project_id=PROJECT_ID)
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")


# Create a new client and connect to the server
MONGODB_CLIENT = MongoClient(MONGO_DB_URI, server_api=ServerApi("1"))
DB = MONGODB_CLIENT["LITCOACH"]
USERS_COLLECTIONS = DB["users"]


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


class GithubCode(BaseModel):
    code: str


class LeetcodeProblem(BaseModel):
    problem: str
    context: str
    code: str
    github_id: str
    llm: str


# class User(BaseModel):
#     email: str
#     access_token: str


@app.get("/health")
def health_check():
    return {"message": "healthy"}


## Login and Signup
@app.post("/github_access_token")
def github_callback(github_code: GithubCode):
    # TODO: Create user in mongo db
    response = requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": github_code.code,
        },
        headers={"Accept": "application/json"},
    )

    try:
        response.raise_for_status()
        access_token = response.json().get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=400, detail=response.json().get("error_description")
            )

        github_user_info: dict = get_user_info_from_github(access_token=access_token)
        user_id = github_user_info["id"]
        username = github_user_info["login"]
        email = github_user_info.get("email")
        avatar_url = github_user_info.get("avatar_url")

        existing_user = USERS_COLLECTIONS.find_one({"user_id": user_id})

        if not existing_user:
            # Insert new user if they don't exist
            USERS_COLLECTIONS.insert_one(
                {
                    "user_id": user_id,
                    "username": username,
                    "email": email,
                    "avatar_url": avatar_url,
                    "access_token": access_token,
                }
            )
            return {"message": "User added successfully", "user_id": user_id}
        return {"message": "User already exists", "user_id": user_id}

    except HTTPException as e:
        raise e

    except requests.RequestException as e:
        raise HTTPException(
            status_code=getattr(e.response, "status_code", 500), detail=str(e)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/get_ai_help")
def ai_help(problem_context: LeetcodeProblem):
    tokens = get_token_count(problem_context.llm)

    # Check if the user is a premium user
    is_premium = is_user_premium(problem_context.github_id)

    # If the user is not premium, check if they have enough tokens
    if not is_premium:
        has_enough_tokens = user_has_enough_tokens(problem_context.github_id, tokens)
        if not has_enough_tokens:
            raise HTTPException(
                status_code=403,
                detail="Insufficient tokens. Please upgrade to premium or buy more tokens.",
            )

    # Route to the correct LLM based on the request
    if problem_context.llm == "gpt-4o-mini":
        # Call the gpt4o-mini function and return a streaming response
        prompt = get_open_ai_prompt(
            problem=problem_context.problem,
            chat_context=problem_context.context,
            user_code=problem_context.code,
        )

        return StreamingResponse(
            OPEN_AI_CLIENT.call_chat_model(
                model=problem_context.llm, messages=prompt, stream=True
            ),
            media_type="text/event-stream",
        )

    elif problem_context.llm == "gpt4o":
        raise HTTPException(status_code=500, detail="LLM Not available!")

    elif problem_context.llm == "claude":
        raise HTTPException(status_code=500, detail="LLM Not available!")

    # Default response if no valid LLM is matched
    raise HTTPException(status_code=400, detail="Invalid LLM specified.")


# @app.post("/upsert_user")


# /getaihelp
# context, problem statment, user solution, github id


# /pushToGithub
# github id

# /getRepoList
#

# /createnewRepo

# /user

#
