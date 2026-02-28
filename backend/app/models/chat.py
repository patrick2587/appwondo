import enum

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class ChannelType(str, enum.Enum):
    PUBLIC = "public"
    GROUP = "group"
    DIRECT = "direct"


class ChatChannel(Base, TimestampMixin):
    __tablename__ = "chat_channels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[ChannelType] = mapped_column(
        Enum(ChannelType), default=ChannelType.PUBLIC, nullable=False
    )
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    members: Mapped[list["ChatChannelMember"]] = relationship(back_populates="channel")
    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="channel")


class ChatChannelMember(Base, TimestampMixin):
    __tablename__ = "chat_channel_members"

    channel_id: Mapped[str] = mapped_column(
        ForeignKey("chat_channels.id"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)

    channel: Mapped[ChatChannel] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()  # noqa: F821


class ChatMessage(Base, TimestampMixin):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    channel_id: Mapped[str] = mapped_column(ForeignKey("chat_channels.id"), nullable=False)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("chat_messages.id"), default=None
    )
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    channel: Mapped[ChatChannel] = relationship(back_populates="messages")
    sender: Mapped["User"] = relationship()  # noqa: F821
    parent: Mapped["ChatMessage | None"] = relationship(remote_side="ChatMessage.id")
