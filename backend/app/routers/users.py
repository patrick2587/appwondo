from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.user import Role, User
from app.schemas.user import PasswordChange, UserRead, UserRoleUpdate, UserUpdate
from app.services.user_service import (
    change_password,
    export_user_data,
    list_users,
    soft_delete_user,
    update_user,
    update_user_role,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)):
    return user


@router.patch("/me", response_model=UserRead)
async def patch_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await update_user(db, user, data)


@router.post("/me/password")
async def change_my_password(
    data: PasswordChange,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await change_password(db, user, data)
    return {"detail": "Passwort geandert"}


@router.delete("/me")
async def delete_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await soft_delete_user(db, user)
    return {"detail": "Konto geloscht"}


@router.get("/me/export")
async def export_my_data(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await export_user_data(db, user)


@router.get("/", response_model=list[UserRead])
async def get_users(
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await list_users(db)


@router.patch("/{user_id}/role", response_model=UserRead)
async def change_user_role(
    user_id: str,
    data: UserRoleUpdate,
    user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await update_user_role(db, user_id, data.role)
