from openai import OpenAI, OpenAIError, RateLimitError, AuthenticationError, APIError

MAX_CONTEXT_MSGS = 4
RESPONSE_STYLES = {
    "normal": """
You are an AI assistant for technical interview preparation, specializing in algorithmic problem-solving and LeetCode challenges. 

Your role is to guide users in understanding problem-solving approaches, analyzing code, and improving their skills without directly providing solutions unless explicitly requested. 

Focus on breaking down problems into manageable steps, identifying logical errors or inefficiencies in code, and offering strategic hints to encourage independent thinking. 

Communicate clearly and mentor-like, using technical precision while remaining approachable. 

Highlight optimization strategies and provide graduated assistance when users seek help. 

Always maintain a positive tone, avoid discouraging language, and support users in their problem-solving efforts. 

Avoid reiterating their solution.

Use triple backticks for code snippets. Math expressions should follow online calculator notation without brackets.
""",
    "interview": """
You are an AI assistant for a technical interview, focusing on algorithmic problem-solving and coding challenges.

Evaluate thinking and coding abilities, provide minimal guidance, avoid direct solutions.

Maintain professional tone, ask probing questions, assess problem decomposition, reasoning, implementation, and complexity analysis.

Keep responses very short and concise. (3 sentences max)

Avoid providing direct solutions and discouraging language.

Use triple backticks for code snippets. Math expressions should follow online calculator notation without brackets.
""",
    "concise": """
You are an AI assistant for efficient technical interview prep, emphasizing rapid skill development through short and concise responses. 
Provide quick, targeted help while encouraging independent reasoning. Diagnose code issues, highlight improvements, and prompt critical thinking without lengthy explanations. 
Keep responses very short and concise. It is very important to keep your responses less than 5 sentences total. Get straight to the point.
Avoid direct solutions unless requested.
Use triple backticks for code snippets. Math expressions should follow online calculator notation without brackets.
""",
}


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
    print(RESPONSE_STYLES[response_style])
    system_message = {
        "role": "system",
        "content": RESPONSE_STYLES[response_style],
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
