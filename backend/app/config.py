from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./data/leadflow.db"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    seed_timezone: str = "Asia/Kolkata"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
