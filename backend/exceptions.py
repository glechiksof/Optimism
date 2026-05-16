from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError


class AppError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code, content={"error": True, "message": exc.message}
    )


async def validation_exception_handler(request: Request, exc: ValidationError):
    errors = [
        {"field": e["loc"][-1], "message": e["msg"]} for e in exc.errors()
    ]
    return JSONResponse(status_code=422, content={"detail": errors})
