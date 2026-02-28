from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.user import Role, User
from app.rate_limit import limiter
from app.schemas.auth import (
    InvitationCreate,
    InvitationRead,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services.auth_service import (
    create_invitation,
    list_invitations,
    login_user,
    refresh_tokens,
    register_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    user, access_token, refresh_token = await register_user(
        db, data.email, data.password, data.display_name, data.invite_token
    )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user, access_token, refresh_token = await login_user(db, data.email, data.password)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: RefreshRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    access_token, new_refresh = await refresh_tokens(db, request.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"detail": "Erfolgreich abgemeldet"}


@router.post("/invitations", response_model=InvitationRead)
async def create_invite(
    data: InvitationCreate,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await create_invitation(db, data, user.id)


@router.get("/invitations", response_model=list[InvitationRead])
async def get_invitations(
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await list_invitations(db)
