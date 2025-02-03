from fastapi import APIRouter

from .access_token import router as access_token_router
from .create_repo import router as create_repo_router
from .submit_problem import router as submit_problem_router
from .repos import router as repos_router
from .ai_help import router as ai_help_router
from .valid_user import router as valid_user_router

router = APIRouter()

router.include_router(access_token_router, prefix="/auth", tags=["Authentication"])
router.include_router(ai_help_router, prefix="/ai", tags=["AI Assistance"])

router.include_router(create_repo_router, prefix="/user", tags=["Repositories"])
router.include_router(submit_problem_router, prefix="/user", tags=["Submissions"])
router.include_router(repos_router, prefix="/user", tags=["Repositories"])
router.include_router(valid_user_router, prefix="/user", tags=["User Validation"])

__all__ = [
    "router",
]
