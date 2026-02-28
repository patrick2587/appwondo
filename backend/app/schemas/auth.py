from datetime import datetime

from pydantic import BaseModel, EmailStr

from app.models.user import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    invite_token: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class InvitationCreate(BaseModel):
    role: Role = Role.MITGLIED
    expires_hours: int = 72


class InvitationRead(BaseModel):
    id: str
    token: str
    role: Role
    created_by: str
    expires_at: datetime
    used_at: datetime | None

    model_config = {"from_attributes": True}
