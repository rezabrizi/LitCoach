from openai import OpenAI, OpenAIError, RateLimitError, AuthenticationError, APIError
from api.config import PROMPTS

MAX_CONTEXT_MSGS = 4


class AIClient:
    def __init__(self, openai_api_key: str):
        self.oa_client = OpenAI(api_key=openai_api_key)

    def call_chat_model(self, messages: list):
        try:
            response = self.oa_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                stream=True,
                stream_options={"include_usage": True},
            )
            for chunk in response:
                yield chunk
        except (RateLimitError, AuthenticationError, APIError) as e:
            raise OpenAIError(f"{e.__class__.__name__}: {str(e)}")
        except Exception as e:
            raise OpenAIError(f"An unexpected error occurred: {str(e)}")


def get_ai_prompt(
    problem: str,
    chat_context: list,
    user_code: str,
    question: str,
    response_style: str,
):
    system_message = {
        "role": "system",
        "content": PROMPTS.get(response_style),
    }
    user_message = {
        "role": "user",
        "content": f"""
            LeetCode problem:\n{problem}\n
            User's current code attempt:\n{user_code}\n
            User's question:\n{question}
        """,
    }
    formatted_chat_context = [
        {"role": message.role, "content": message.content}
        for message in chat_context[-MAX_CONTEXT_MSGS:]
    ]
    return [system_message] + formatted_chat_context + [user_message]
