import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, generate_uuid


class Role(str, enum.Enum):
    ADMIN = "admin"
    VORSTAND = "vorstand"
    MITGLIED = "mitglied"
    GAST = "gast"


class User(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.MITGLIED, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), default=None)

    invitations_created: Mapped[list["Invitation"]] = relationship(
        back_populates="created_by_user", foreign_keys="Invitation.created_by"
    )


class Invitation(Base, TimestampMixin):
    __tablename__ = "invitations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    token: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.MITGLIED, nullable=False)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    created_by_user: Mapped[User] = relationship(
        back_populates="invitations_created", foreign_keys=[created_by]
    )
