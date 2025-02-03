from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from openai import OpenAIError

from api.models import LeetcodeProblem
from api.db.database import can_user_use_ai
from api.services.openai import get_open_ai_prompt, OpenAIClient

from api.config import settings

openai_client = OpenAIClient(settings.OPENAI_KEY, settings.OPENAI_PROJECT_ID)

router = APIRouter()


@router.post("/get_ai_help")
def ai_help(
    problem_context: LeetcodeProblem,
):
    if not can_user_use_ai(problem_context.github_id):
        raise HTTPException(
            status_code=403,
            detail="Insufficient tokens. Please upgrade to premium or buy more tokens.",
        )

    # Route to the correct LLM based on the request
    if problem_context.llm == "gpt-4o-mini":
        try:
            # Call the gpt4o-mini function and return a streaming response
            prompt = get_open_ai_prompt(
                problem=problem_context.problem,
                chat_context=problem_context.context,
                user_code=problem_context.code,
            )

            return StreamingResponse(
                openai_client.call_chat_model(
                    model=problem_context.llm,
                    messages=prompt,
                    stream=True,
                    # TODO(reza): insert usage for the user
                    stream_options={"include_usage": True},
                ),
                media_type="text/event-stream",
            )

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
    elif problem_context.llm == "gpt-4o":
        raise HTTPException(status_code=500, detail="LLM Not available!")

    elif problem_context.llm == "claude":
        raise HTTPException(status_code=500, detail="LLM Not available!")

    # Default response if no valid LLM is matched
    raise HTTPException(status_code=400, detail="Invalid LLM specified.")
