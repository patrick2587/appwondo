from fastapi import Request
from fastapi.responses import JSONResponse


class AppException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail


class NotFoundError(AppException):
    def __init__(self, detail: str = "Nicht gefunden"):
        super().__init__(404, detail)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Keine Berechtigung"):
        super().__init__(403, detail)


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Nicht autorisiert"):
        super().__init__(401, detail)


class ConflictError(AppException):
    def __init__(self, detail: str = "Konflikt"):
        super().__init__(409, detail)


class BadRequestError(AppException):
    def __init__(self, detail: str = "Ungultige Anfrage"):
        super().__init__(400, detail)


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
