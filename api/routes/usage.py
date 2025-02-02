from fastapi import APIRouter, HTTPException, 
from datetime import datetime, timezone

from api.db.mongo import USAGE_COLLECTION


router = APIRouter()


@router.post("/usage")
def post_usage(
    user_id: int,
    completion_tokens: int,
    prompt_tokens: int,
    ai_model: str,
    problem_name: str,
):
    if ai_model not in set("gpt-4o-mini"):
        return HTTPException(status_code=403, detail="Invalid model")

    now = datetime.now(timezone.utc)
    total_tokens = completion_tokens * 4 + prompt_tokens
    USAGE_COLLECTION.insert(
        {
            "user_id": user_id,
            "problem_name": problem_name,
            "tokens": total_tokens,
            "tz": now,
            "ai_model": ai_model,
        }
    )

    return "usage updated", 200
