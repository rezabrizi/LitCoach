from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from api.models import AIHelp
from api.db import can_user_use_ai, upsert_user
from api.services.openai import get_ai_prompt, AIClient
from api.config import settings


openai_client = AIClient(
    settings.OPENAI_KEY, settings.OPENAI_PROJECT_ID, None, settings.DEEPSEEK_KEY
)
router = APIRouter()


@router.post("/get_ai_help")
def ai_help(request: AIHelp):
    # if not can_user_use_ai(request.user_github_id):
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Insufficient tokens. Please upgrade to premium or buy more tokens.",
    #     )

    if request.llm in ["gpt-4o-mini", "deepseek-chat"]:
        try:
            prompt = get_ai_prompt(
                problem=request.leetcode_problem_description,
                chat_context=request.conversation_context,
                user_code=request.user_code,
                question=request.user_prompt,
            )

            response = openai_client.call_chat_model(
                model=request.llm,
                messages=prompt,
            )

            def generate():
                total_completion_tokens = 0
                total_prompt_tokens = 0
                for chunk in response:
                    if chunk.choices and chunk.choices[0].delta.content is not None:
                        yield chunk.choices[0].delta.content
                    elif hasattr(chunk, "usage") and chunk.usage is not None:
                        total_completion_tokens += chunk.usage.completion_tokens
                        total_prompt_tokens += chunk.usage.prompt_tokens

                total_tokens = total_completion_tokens * 4 + total_prompt_tokens
                print(total_completion_tokens)
                upsert_user({"user_id": request.user_github_id, "tokens": total_tokens})

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
    else:
        raise HTTPException(status_code=500, detail="Invalid model")
