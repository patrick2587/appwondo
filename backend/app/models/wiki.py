from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, generate_uuid


class WikiPage(Base, TimestampMixin):
    __tablename__ = "wiki_pages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="", nullable=False)
    parent_id: Mapped[str | None] = mapped_column(
        ForeignKey("wiki_pages.id"), default=None
    )
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    children: Mapped[list["WikiPage"]] = relationship(back_populates="parent")
    parent: Mapped["WikiPage | None"] = relationship(
        back_populates="children", remote_side="WikiPage.id"
    )
    revisions: Mapped[list["WikiRevision"]] = relationship(back_populates="page")
    creator: Mapped["User"] = relationship()  # noqa: F821


class WikiRevision(Base, TimestampMixin):
    __tablename__ = "wiki_revisions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    page_id: Mapped[str] = mapped_column(ForeignKey("wiki_pages.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    edited_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)

    page: Mapped[WikiPage] = relationship(back_populates="revisions")
    editor: Mapped["User"] = relationship()  # noqa: F821
