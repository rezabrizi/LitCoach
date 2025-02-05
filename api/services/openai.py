from openai import OpenAI, OpenAIError, RateLimitError, AuthenticationError, APIError


class AIClient:
    def __init__(
        self, oa_api_key: str, oa_project_id: str, oa_organization: str, ds_api_key: str
    ):
        self.oa_client = OpenAI(
            api_key=oa_api_key,
            organization=oa_organization,
            project=oa_project_id,
        )

        self.ds_client = OpenAI(api_key=ds_api_key, base_url="https://api.deepseek.com")

    def call_chat_model(self, model: str, messages: list):
        try:
            if model == "deepseek-chat":
                response = self.ds_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True,
                    stream_options={"include_usage": True},
                )
            else:
                response = self.oa_client.chat.completions.create(
                    model=model,
                    messages=messages,
                    stream=True,
                    stream_options={"include_usage": True},
                )

            for chunk in response:
                yield chunk
        except RateLimitError as e:
            raise OpenAIError(f"Rate limit exceeded: {str(e)}")
        except AuthenticationError as e:
            raise OpenAIError(f"Authentication error: {str(e)}")
        except APIError as e:
            raise OpenAIError(f"API error: {str(e)}")
        except Exception as e:
            raise OpenAIError(f"An unexpected error occurred: {str(e)}")


def get_ai_prompt(problem: str, chat_context: str, user_code: str, question: str):
    return [
        {
            "role": "system",
            "content": """
                You are an AI assistant specializing in technical interview tutoring, particularly for LeetCode-style coding problems. 
                Your primary role is to guide users in understanding their mistakes and improving problem-solving skills rather than 
                directly providing solutions. You analyze users' code for logical errors, inefficiencies, or syntax issues and explain 
                them clearly without immediately offering corrections. You provide hints and suggest strategies while encouraging independent 
                problem-solving. Only when explicitly asked should you provide complete solutions or corrected code. 
                Your approach should be patient, educational, and focused on constructive feedback, ensuring that users gain a deeper 
                understanding of algorithms and coding techniques.
            """,
        },
        {
            "role": "user",
            "content": f"""
                LeetCode problem:\n{problem}\n"
                Current conversation context:\n{chat_context}\n"
                User's current code attempt:\n{user_code}\n\n"
                User's question:\n{question}\n"
                """,
        },
    ]
