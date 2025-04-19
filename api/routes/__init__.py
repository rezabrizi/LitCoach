from fastapi import APIRouter

from .github_auth import router as access_token_router
from .create_repo import router as create_repo_router
from .leetcode_submission import router as github_sync_router
from .ai_assistance import router as ai_response_router
from .stripe_webhook import router as stripe_webhook_router
from .subscribe import router as subscribe_router
from .unsubscribe import router as unsubscribe_router
from .renew_subscription import router as renew_subscription_router
from .user_info import router as user_info_router
from .register_user import router as register_user_router
from .github_access_token import router as github_access_token_router
from .github_user_info import router as github_user_info_router

router = APIRouter()

# api/users/register
router.include_router(register_user_router)

# /api/github/user/info
router.include_router(github_user_info_router)

# /api/github/access_token
router.include_router(github_access_token_router)

# /auth/github
router.include_router(access_token_router, prefix="/auth")

# /ai/assistance
router.include_router(ai_response_router, prefix="/ai")

# /user/github/repo
router.include_router(create_repo_router, prefix="/user/github")

# /user/github/submission
router.include_router(github_sync_router, prefix="/user/github")

# /user/info
router.include_router(user_info_router, prefix="/user")

# /stripe/webhook
router.include_router(stripe_webhook_router, prefix="/stripe")

# /subscription/subscribe
router.include_router(subscribe_router, prefix="/subscription")

# /subscription/unsubscribe
router.include_router(unsubscribe_router, prefix="/subscription")

# /subscription/renew
router.include_router(renew_subscription_router, prefix="/subscription")

__all__ = [
    "router",
]
