from openai import OpenAI, OpenAIError, RateLimitError, AuthenticationError, APIError


class AIClient:
    def __init__(self, openai_api_key: str, deepseek_api_key: str):
        self.oa_client = OpenAI(api_key=openai_api_key)
        self.ds_client = OpenAI(
            api_key=deepseek_api_key, base_url="https://api.deepseek.com"
        )

    def call_chat_model(self, model: str, messages: list):
        client = self.ds_client if model == "deepseek-chat" else self.oa_client
        try:
            response = client.chat.completions.create(
                model=model,
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


def get_ai_prompt(problem: str, chat_context: list, user_code: str, question: str):
    system_message = {
        "role": "system",
        "content": """
            You are an AI assistant specializing in technical interview tutoring, particularly for LeetCode-style coding problems. 
            Your primary role is to guide users in understanding their mistakes and improving problem-solving skills rather than 
            directly providing solutions. You analyze users' code for logical errors, inefficiencies, or syntax issues and explain 
            them clearly without immediately offering corrections. You provide hints and suggest strategies while encouraging independent 
            problem-solving. Only when explicitly asked should you provide complete solutions or corrected code.  
            You should respond like a friend. Be education and focus on constructive feedback. Get straight to the point in your response.
            Always aim for short responses as much as possible.
        """,
    }
    user_message = {
        "role": "user",
        "content": f"""
            LeetCode problem:\n{problem}\n
            User's current code attempt:\n{user_code}\n
            User's question:\n{question}
        """,
    }
    return [system_message, *chat_context, user_message]
