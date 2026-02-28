from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.passwords import hash_password, verify_password
from app.exceptions import BadRequestError, NotFoundError
from app.models.user import Role, User
from app.schemas.user import PasswordChange, UserUpdate


async def get_user(db: AsyncSession, user_id: str) -> User:
    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("Benutzer nicht gefunden")
    return user


async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
    if data.display_name is not None:
        user.display_name = data.display_name
    if data.avatar_url is not None:
        user.avatar_url = data.avatar_url
    await db.flush()
    return user


async def change_password(db: AsyncSession, user: User, data: PasswordChange) -> None:
    if not verify_password(data.current_password, user.password_hash):
        raise BadRequestError("Aktuelles Passwort ist falsch")
    user.password_hash = hash_password(data.new_password)
    await db.flush()


async def update_user_role(db: AsyncSession, user_id: str, role: Role) -> User:
    user = await get_user(db, user_id)
    user.role = role
    await db.flush()
    return user


async def soft_delete_user(db: AsyncSession, user: User) -> None:
    user.deleted_at = datetime.now(UTC)
    user.email = f"deleted_{user.id}@deleted.local"
    user.display_name = "Geloschter Benutzer"
    user.password_hash = "deleted"
    user.avatar_url = None
    await db.flush()


async def list_users(db: AsyncSession) -> list[User]:
    result = await db.execute(
        select(User).where(User.deleted_at.is_(None)).order_by(User.display_name)
    )
    return list(result.scalars().all())


async def export_user_data(db: AsyncSession, user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "display_name": user.display_name,
        "role": user.role.value,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
    }
