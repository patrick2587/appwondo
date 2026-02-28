import enum

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class AlbumVisibility(str, enum.Enum):
    PUBLIC = "public"
    MEMBERS_ONLY = "members_only"


class Album(Base, TimestampMixin):
    __tablename__ = "albums"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    visibility: Mapped[AlbumVisibility] = mapped_column(
        Enum(AlbumVisibility), default=AlbumVisibility.MEMBERS_ONLY, nullable=False
    )
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    images: Mapped[list["Image"]] = relationship(back_populates="album")
    creator: Mapped["User"] = relationship()  # noqa: F821


class Image(Base, TimestampMixin):
    __tablename__ = "images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    album_id: Mapped[str] = mapped_column(ForeignKey("albums.id"), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(500), default=None)

    album: Mapped[Album] = relationship(back_populates="images")
    uploader: Mapped["User"] = relationship()  # noqa: F821
