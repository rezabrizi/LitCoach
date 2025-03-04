from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("backend")
logger.setLevel(logging.INFO)


class Settings(BaseSettings):
    MONGO_DB_URI: str
    OPENAI_KEY: str
    GITHUB_CLIENT_ID: str
    GITHUB_CLIENT_SECRET: str
    STRIPE_WEBHOOK_SECRET: str
    STRIPE_API_KEY: str
    BASE_URL: str
    model_config = SettingsConfigDict(env_file=".env", extra="allow")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

logger.info("Settings Loaded.")
