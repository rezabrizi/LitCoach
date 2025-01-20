from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    CLIENT_ID: str
    CLIENT_SECRET: str

    class Config:
        env_file = ".env"
        extra = "allow" 

settings = Settings()