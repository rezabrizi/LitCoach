from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from api.models import AIHelp
from api.db import can_user_use_ai, update_user_tokens
from api.services.ai_client import get_ai_prompt, AIClient
from api.config import settings

openai_client = AIClient(
    openai_api_key=settings.OPENAI_KEY,
    deepseek_api_key=settings.DEEPSEEK_KEY,
)
router = APIRouter()


@router.post("/get_ai_help")
def ai_help(request: AIHelp):
    if not can_user_use_ai(request.github_id):
        raise HTTPException(
            status_code=403,
            detail="Insufficient tokens. Please upgrade to premium or buy more tokens.",
        )

    if request.llm not in ["gpt-4o-mini", "deepseek-chat"]:
        raise HTTPException(status_code=400, detail="Invalid model")

    try:
        prompt = get_ai_prompt(
            problem=request.problem_description,
            chat_context=request.context,
            user_code=request.code,
            question=request.prompt,
        )

        response = openai_client.call_chat_model(
            model=request.llm,
            messages=prompt,
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
            update_user_tokens(request.github_id, total_tokens)

        return StreamingResponse(generate(), media_type="text/event-stream")

    except OpenAIError as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI service error: {str(e)}",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}",
        )
