import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.auth.passwords import hash_password, verify_password
from app.exceptions import BadRequestError, NotFoundError, UnauthorizedError
from app.models.user import Invitation, Role, User
from app.schemas.auth import InvitationCreate


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    display_name: str,
    invite_token: str | None = None,
) -> tuple[User, str, str]:
    role = Role.GAST

    if invite_token:
        result = await db.execute(
            select(Invitation).where(
                Invitation.token == invite_token,
                Invitation.used_at.is_(None),
                Invitation.expires_at > datetime.now(UTC),
            )
        )
        invitation = result.scalar_one_or_none()
        if not invitation:
            raise BadRequestError("Ungultiger oder abgelaufener Einladungslink")
        role = invitation.role
        invitation.used_at = datetime.now(UTC)

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise BadRequestError("E-Mail-Adresse bereits registriert")

    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
        role=role,
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id)
    return user, access_token, refresh_token


async def login_user(
    db: AsyncSession, email: str, password: str
) -> tuple[User, str, str]:
    result = await db.execute(
        select(User).where(User.email == email, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Ungultige E-Mail oder Passwort")

    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id)
    return user, access_token, refresh_token


async def refresh_tokens(
    db: AsyncSession, refresh_token: str
) -> tuple[str, str]:
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Ungultiger Token-Typ")
        user_id = payload.get("sub")
    except Exception:
        raise UnauthorizedError("Ungultiger Refresh-Token")

    result = await db.execute(
        select(User).where(User.id == user_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("Benutzer nicht gefunden")

    access_token = create_access_token(user.id, user.role.value)
    new_refresh = create_refresh_token(user.id)
    return access_token, new_refresh


async def create_invitation(
    db: AsyncSession, data: InvitationCreate, created_by: str
) -> Invitation:
    invitation = Invitation(
        token=secrets.token_urlsafe(32),
        role=data.role,
        created_by=created_by,
        expires_at=datetime.now(UTC) + timedelta(hours=data.expires_hours),
    )
    db.add(invitation)
    await db.flush()
    return invitation


async def list_invitations(db: AsyncSession) -> list[Invitation]:
    result = await db.execute(
        select(Invitation).order_by(Invitation.created_at.desc())
    )
    return list(result.scalars().all())
