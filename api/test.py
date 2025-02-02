from api.config import openai_client

message = [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "what is your name?"},
]
x = openai_client.call_chat_model(
    model="gpt-4o-mini",
    messages=message,
    stream=False,
    stream_options={"include_usage": True},
)
print(x)
