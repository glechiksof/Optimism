from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_INSECURE_SECRET = "change-me-in-production-minimum-32-chars"


class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_EXPIRES_IN: int = 7
    # Keep as str so pydantic-settings doesn't JSON-decode before we can parse it.
    # Use cors_origins_list property wherever a list is needed.
    CORS_ORIGINS: str = "http://localhost:5173"
    ENVIRONMENT: str = "development"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def cors_origins_list(self) -> list[str]:
        import json as _json
        v = self.CORS_ORIGINS.strip()
        if not v:
            return ["http://localhost:5173"]
        if v.startswith("["):
            try:
                return _json.loads(v)
            except Exception:
                pass
        return [o.strip() for o in v.split(",") if o.strip()]

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
