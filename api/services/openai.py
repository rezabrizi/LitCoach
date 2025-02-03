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

    def call_chat_model(
        self, model: str, messages: list, stream: bool = False, stream_options=None
    ):
        """
        Calls the specified OpenAI chat model with the given message history and optional parameters.

        :param model: The name of the OpenAI model to use (e.g., "gpt-3.5-turbo", "gpt-4").
        :param messages: A list of message dicts (e.g., {"role": "user", "content": "Hello!"}).
        :param stream: Whether to stream the output.
        :return: A generator for the streamed response and the total token usage.
        """
        if stream:
            return self._stream_response(model, messages, stream_options)
        else:
            return self._get_response(model, messages)

    def _stream_response(self, model, messages, stream_options):
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            stream_options=stream_options,
        )

        for chunk in response:
            if chunk.choices and chunk.choices[0].delta.content is not None:
                yield "data: " + chunk.choices[0].delta.content + "\n\n"

            elif hasattr(chunk, "usage") and chunk.usage is not None:
                yield "meta: " + str(chunk.usage.completion_tokens) + " " + str(
                    chunk.usage.prompt_tokens
                ) + "\n\n"

    def _get_response(self, model, messages):
        response = self.client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False,
        )
        return response.choices[0].message.content

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
