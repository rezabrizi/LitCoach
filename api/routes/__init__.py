from .user_register import router as user_register_router
from .user_info import router as user_info_router
from .user_github_info import router as user_github_info_router
from .user_create_repo import router as user_create_repo_router
from .user_leetcode_submission import router as user_leetcode_submission_router
from .user_subscription_info import router as user_subscription_info_router

from .github_access_token import router as github_access_token_router
from .github_auth import router as github_auth_router  # Legacy

from .subscription_subscribe import router as subscription_subscribe_router
from .subscription_unsubscribe import router as subscription_unsubscribe_router
from .subscription_renew import router as subscription_renew_router

from .ai_assistance import router as ai_assistance_router
from .stripe_webhook import router as stripe_webhook_router

__all__ = [
    "user_register_router",
    "user_info_router",  # Legacy
    "user_github_info_router",
    "user_create_repo_router",
    "user_leetcode_submission_router",
    "user_subscription_info_router",
    "github_access_token_router",
    "github_auth_router",  # Legacy
    "subscription_subscribe_router",
    "subscription_unsubscribe_router",
    "subscription_renew_router",
    "ai_assistance_router",
    "stripe_webhook_router",
]
