from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from openai import OpenAIError

from api.models.problem import LeetcodeProblem
from api.services.database import is_user_premium, get_monthly_usage
from api.utils.openai_utils import get_open_ai_prompt, OpenAIClient
from api.app import get_openai_client


router = APIRouter()


@router.post("/get_ai_help")
def ai_help(
    problem_context: LeetcodeProblem,
    openai_client: OpenAIClient = Depends(get_openai_client),
):
    # TODO (Reza): Implement token count based on the models
    tokens_needed = get_token_count(problem_context)

    # Check if the user is a premium user
    is_premium = is_user_premium(problem_context.github_id)

    # If the user is not premium, check if they have enough tokens
    if not is_premium:
        tokens_used = get_monthly_usage(problem_context.github_id)
        if tokens_needed + tokens_used >= 30000:
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
