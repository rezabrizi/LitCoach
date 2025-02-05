from pydantic import BaseModel


class AIHelp(BaseModel):
    leetcode_problem_description: str
    conversation_context: str
    user_code: str
    user_prompt: str
    user_github_id: int
    llm: str
