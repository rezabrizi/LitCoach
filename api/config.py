from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import logging
import sys
import yaml

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
with open("api/prompts.yaml", "r") as f:
    PROMPTS = yaml.safe_load(f)

logger.info("Settings Loaded.")
