import json
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_INSECURE_SECRET = "change-me-in-production-minimum-32-chars"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRES_IN: int = 7
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> object:
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("["):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def validate_jwt_secret(self) -> "Settings":
        """Runs after every field is populated, so ENVIRONMENT is available
        regardless of declaration order. Rejects weak/placeholder secrets
        outside development."""
        if len(self.JWT_SECRET) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters")
        if self.JWT_SECRET == DEFAULT_INSECURE_SECRET and self.ENVIRONMENT != "development":
            raise ValueError(
                "JWT_SECRET is set to the example placeholder. "
                "Set a strong secret (>=32 random chars) outside development."
            )
        return self


settings = Settings()
