from openai import OpenAI, OpenAIError, RateLimitError, AuthenticationError, APIError


class OpenAIClient:
    def __init__(self, API_KEY: str, project_id: str, organization: str = None):
        """
        Initializes the OpenAI client with the provided API key and optional organization.

        :param API_KEY: Your OpenAI API key.
        :param project_id: Your OpenAI project ID.
        :param organization: (Optional) Your OpenAI organization ID.
        """
        self.client = OpenAI(
            api_key=API_KEY,
            organization=organization,
            project=project_id,
        )

    def call_chat_model(self, model: str, messages: list, stream: bool = False):
        """
        Calls the specified OpenAI chat model with the given message history and optional parameters.

        :param model: The name of the OpenAI model to use (e.g., "gpt-3.5-turbo", "gpt-4").
        :param messages: A list of message dicts (e.g., {"role": "user", "content": "Hello!"}).
        :param stream: Whether to stream the output.
        :param kwargs: Additional parameters for the OpenAI API call (e.g., max_tokens, temperature).
        :return: The model's response (if stream=False) or generator (if stream=True).
        """
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                stream=stream,
            )

            if stream:

                for chunk in response:
                    if chunk.choices[0].delta.content is not None:
                        chunk.choices[0].delta.content
                        current_response = chunk.choices[0].delta.content
                        yield "data: " + current_response + "\n\n"
            else:
                return response.choices[0].message.content

        except RateLimitError as e:
            # Handle rate-limiting
            raise OpenAIError(f"Rate limit exceeded: {e}") from e

        except AuthenticationError as e:
            # Handle authentication issues
            raise OpenAIError(f"Authentication failed: {e}") from e

        except APIError as e:
            # Handle general API errors (e.g., server errors)
            raise OpenAIError(f"OpenAI API error: {e}") from e

        except Exception as e:
            # Handle unexpected errors
            raise Exception(f"An unexpected error occurred: {e}") from e

    def list_models(self):
        """
        Retrieves a list of available OpenAI models.

        :return: A list of available models.
        """
        try:
            models = self.client.models.list()
            models_list = []
            for model in models:
                models_list.append(models)
            return models_list
        except Exception as e:
            print(f"Error listing models: {e}")
            return []


def get_open_ai_prompt(problem: str, chat_context: str, user_code: str):
    prompt = [
        {
            "role": "system",
            "content": (
                "You are a helpful assistant for solving coding problems on LeetCode. "
                "You assist users in understanding the problem and debugging their code."
            ),
        },
        {
            "role": "user",
            "content": f"Here is the LeetCode problem:\n{problem}\n"
            f"Current conversation context:\n{chat_context}\n"
            f"User's current code attempt:\n{user_code}\n\n"
            "Please review the user's code, provide feedback, and suggest improvements "
            "or guidance for solving the problem.",
        },
    ]
    return prompt
