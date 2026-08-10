import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "Central Auth Service"
    DATABASE_URL: str
    SECRET_KEY: str
    
    # Email settings
    ZEPTOMAIL_API_KEY: str | None = None
    ZEPTOMAIL_FROM_ADDRESS: str | None = None
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
