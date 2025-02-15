from fastapi import APIRouter

from .access_token import router as access_token_router
from .create_repo import router as create_repo_router
from .push_solution import router as push_solution_to_github_router
from .repos import router as repos_router
from .ai_response import router as ai_response_router
from .valid_user import router as valid_user_router
from .stripe_webhook import router as stripe_webhook_router
from .subscribe import router as subscribe_router
from .unsubscribe import router as unsubscribe_router

router = APIRouter()

router.include_router(access_token_router, prefix="/auth", tags=["Authentication"])
router.include_router(ai_response_router, prefix="/ai", tags=["AI Assistance"])

router.include_router(create_repo_router, prefix="/user", tags=["Repositories"])
router.include_router(
    push_solution_to_github_router, prefix="/user", tags=["Submissions"]
)
router.include_router(repos_router, prefix="/user", tags=["Repositories"])
router.include_router(valid_user_router, prefix="/user", tags=["User Validation"])

router.include_router(stripe_webhook_router, prefix="/payment", tags=["User Payment"])
router.include_router(subscribe_router, prefix="/payment", tags=["Activate Premium"])
router.include_router(unsubscribe_router, prefix="/payment", tags=["Cancel Premium"])

__all__ = [
    "router",
]
