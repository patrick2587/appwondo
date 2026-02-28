from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import Role


class UserRead(BaseModel):
    id: str
    email: str
    display_name: str
    role: Role
    avatar_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class UserRoleUpdate(BaseModel):
    role: Role
