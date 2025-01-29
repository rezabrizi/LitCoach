from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from api.utils.openai_utils import OpenAIClient


class Settings(BaseSettings):
    MONGO_DB_USERNAME: str
    MONGO_DB_PASS: str
    OPENAI_KEY: str
    OPENAI_PROJECT_ID: str = "proj_tBo3vZb4T5ghUKf96NEzuQNM"
    PROJECT_ID: str = "proj_tBo3vZb4T5ghUKf96NEzuQNM"
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    CUSTOM_VAL: str
    model_config = SettingsConfigDict(env_file=".env", extra="allow")


# @lru_cache
def get_settings():
    return Settings()


settings = get_settings()

openai_client = OpenAIClient(
    API_KEY=settings.OPENAI_KEY, project_id=settings.OPENAI_PROJECT_ID
)
