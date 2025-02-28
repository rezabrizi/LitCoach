from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from api.services import get_next_billing_date
from api.db import resolve_user
from api.config import logger


router = APIRouter()


@router.get("/billing_date")
def next_billing_date(user_id: str):
    try:
        user = resolve_user(user_id)
        if not user or not user.subscription_id:
            raise HTTPException(
                status_code=404, detail="User does not have an active subscription"
            )

        billing_date = get_next_billing_date(user.subscription_id)

        return JSONResponse(
            status_code=200,
            content={"billing_date": billing_date},
        )
    except HTTPException as e:
        logger.error(e)
        raise
    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )
