from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.config import get_settings

from api.routes import (
    user_register_router,
    user_info_router,
    user_github_info_router,
    user_create_repo_router,
    user_leetcode_submission_router,
    github_access_token_router,
    github_auth_router,  # Legacy
    subscription_subscribe_router,
    subscription_unsubscribe_router,
    subscription_renew_router,
    ai_assistance_router,
    stripe_webhook_router,
)

app = FastAPI()
settings = get_settings()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "chrome-extension://pbkbbpmpbidfjbcapgplbdogiljdechf",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"message": "healthy"}


# /user/register
app.include_router(user_register_router)

# /user/info
app.include_router(user_info_router)

# /user/github/info
app.include_router(user_github_info_router)

# /user/github/repo
app.include_router(user_create_repo_router)

# /user/github/submission
app.include_router(user_leetcode_submission_router)


# /subscription/subscribe
app.include_router(subscription_subscribe_router)

# /subscription/unsubscribe
app.include_router(subscription_unsubscribe_router)

# /subscription/renew
app.include_router(subscription_renew_router)


# /github/access-token
app.include_router(github_access_token_router)

# /auth/github
app.include_router(github_auth_router)  # Legacy


# /ai/assistance
app.include_router(ai_assistance_router)

# /stripe/webhook
app.include_router(stripe_webhook_router)
