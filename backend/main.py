from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import settings
from rate_limiter import limiter
from exceptions import AppError, app_error_handler, validation_exception_handler
from routers.auth import router as auth_router
from routers.tournaments import router as tournaments_router
from routers.users import router as users_router
from routers.teams import router as teams_router
from routers.participation import router as participation_router
from routers.matches import router as matches_router
from routers.transitions import router as transitions_router

app = FastAPI(title="Tournament Organizer API")
# Per-route limiter — only routes decorated with @limiter.limit() are throttled.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(tournaments_router, prefix="/tournaments", tags=["tournaments"])
app.include_router(teams_router, prefix="", tags=["teams"])
app.include_router(participation_router, prefix="", tags=["participation"])
app.include_router(matches_router, prefix="", tags=["matches"])
app.include_router(transitions_router, prefix="", tags=["transitions"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
