from fastapi import APIRouter, HTTPException
from api.services import create_checkout_session
from api.models import SubscribeRequest
from api.db import resolve_user

router = APIRouter()


@router.post("/subscribe")
def subscribe(request: SubscribeRequest):
    try:
        user = resolve_user(request.user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return create_checkout_session(user.user_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
