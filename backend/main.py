from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from config import settings
from exceptions import AppError, app_error_handler, validation_exception_handler
from routers.auth import router as auth_router
from routers.tournaments import router as tournaments_router
from routers.users import router as users_router
from routers.teams import router as teams_router

app = FastAPI(title="Tournament Organizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
