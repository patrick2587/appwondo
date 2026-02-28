from collections.abc import Callable

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import decode_token
from app.auth.permissions import has_minimum_role
from app.database import get_db
from app.exceptions import ForbiddenError, UnauthorizedError
from app.models.user import Role, User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedError("Token fehlt")
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise UnauthorizedError("Ungultiger Token-Typ")
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Ungultiger Token")
    except InvalidTokenError:
        raise UnauthorizedError("Ungultiger oder abgelaufener Token")

    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("Benutzer nicht gefunden")
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except UnauthorizedError:
        return None


def require_role(role: Role) -> Callable:
    async def dependency(user: User = Depends(get_current_user)) -> User:
        if not has_minimum_role(user.role, role):
            raise ForbiddenError("Unzureichende Berechtigung")
        return user

    return dependency
