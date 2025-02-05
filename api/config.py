import logging
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MONGO_DB_USERNAME: str
    MONGO_DB_PASS: str
    OPENAI_KEY: str
    DEEPSEEK_KEY: str
    OPENAI_PROJECT_ID: str = "proj_tBo3vZb4T5ghUKf96NEzuQNM"
    PROJECT_ID: str = "proj_tBo3vZb4T5ghUKf96NEzuQNM"
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    CUSTOM_VAL: str
    # STRIPE_WEBHOOK_SECRET: str
    # STRIPE_API_KEY: str
    model_config = SettingsConfigDict(env_file=".env", extra="allow")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Create custom logger
logger = logging.getLogger("Litcoach")
logger.setLevel(logging.DEBUG)

# Create file handler
file_handler = logging.FileHandler("app.log")
file_handler.setLevel(logging.DEBUG)

# Create formatter and add it to the handler
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

# Add handler to the logger
logger.addHandler(file_handler)
logger.debug("LOADED")
