from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from api.models import AIHelp
from api.db import update_user_tokens, resolve_user, reset_tokens_if_needed
from api.services import get_ai_prompt, AIClient, has_active_subscription
from api.config import settings, logger

openai_client = AIClient(openai_api_key=settings.OPENAI_KEY)
router = APIRouter()

MONTHLY_LIMIT = 200000
FIVE_HOUR_LIMIT = 20000


@router.post("/assistance")
def generate_ai_assistance(request: AIHelp):
    user = resolve_user(request.user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    reset_tokens_if_needed(user)
    user = resolve_user(request.user_id)

    if not user.has_premium and not has_active_subscription(user.subscription_id):
        if user.tokens_used_in_past_5_hours >= FIVE_HOUR_LIMIT:
            next_use_time = datetime.fromisoformat(
                user.last_5_hour_cooldown_reset
            ) + timedelta(hours=5)
            raise HTTPException(
                status_code=403,
                detail=f"Exceeded 5-hour limit. You can get AI assistance again on {next_use_time.isoformat()}",
            )

        if user.tokens_used_monthly >= MONTHLY_LIMIT:
            next_use_time = datetime.fromisoformat(
                user.last_monthly_token_reset
            ) + timedelta(days=30)
            raise HTTPException(
                status_code=403,
                detail=f"Exceeded monthly limit. You can get AI assistance again on {next_use_time.isoformat()}",
            )

    if request.response_style not in ["normal", "concise"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid response style. Must be 'normal', 'concise', or 'interview'",
        )

    if request.model_name not in ["gpt-4o", "o3-mini"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid model name. Must be either 'gpt-4o', or 'o3-mini'",
        )

    try:
        prompt = get_ai_prompt(
            problem=request.problem_description,
            chat_context=request.context,
            user_code=request.code,
            question=request.prompt,
            response_style=request.response_style,
        )

        response = openai_client.call_chat_model(
            messages=prompt, model_name=request.model_name
        )

        def generate():
            total_completion_tokens = 0
            total_prompt_tokens = 0
            for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                if hasattr(chunk, "usage") and chunk.usage:
                    total_completion_tokens += chunk.usage.completion_tokens
                    total_prompt_tokens += chunk.usage.prompt_tokens

            total_tokens = total_completion_tokens * 4 + total_prompt_tokens
            update_user_tokens(user.user_id, total_tokens)

        return StreamingResponse(generate(), media_type="text/event-stream")

    except OpenAIError as e:
        logger.error(e)
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI service error: {str(e)}",
        )

    except Exception as e:
        logger.error(e)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}",
        )
