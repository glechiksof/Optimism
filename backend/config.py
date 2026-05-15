from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_INSECURE_SECRET = "change-me-in-production-minimum-32-chars"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRES_IN: int = 7
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        # Allow weak default only in development mode for local dev; reject in any other env.
        # Production must set a strong (>=32 char) secret distinct from the example.
        if v == DEFAULT_INSECURE_SECRET:
            env = info.data.get("ENVIRONMENT", "development")
            if env != "development":
                raise ValueError(
                    "JWT_SECRET is set to the example placeholder. "
                    "Set a strong secret (>=32 random chars) in production."
                )
        if len(v) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        return v


settings = Settings()
