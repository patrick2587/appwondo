import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.exceptions import ConflictError, NotFoundError
from app.models.wiki import WikiPage, WikiRevision
from app.schemas.wiki import WikiPageCreate, WikiPageTreeItem, WikiPageUpdate, WikiRevisionRead


def slugify(title: str) -> str:
    slug = title.lower().strip()
    slug = slug.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    return slug.strip("-")


async def create_page(db: AsyncSession, data: WikiPageCreate, user_id: str) -> WikiPage:
    slug = slugify(data.title)
    existing = await db.execute(select(WikiPage).where(WikiPage.slug == slug))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Seite mit Slug '{slug}' existiert bereits")

    page = WikiPage(
        slug=slug,
        title=data.title,
        content=data.content,
        parent_id=data.parent_id,
        created_by=user_id,
    )
    db.add(page)
    await db.flush()
    return page


async def update_page(
    db: AsyncSession, slug: str, data: WikiPageUpdate, user_id: str
) -> WikiPage:
    page = await get_page_by_slug(db, slug)

    revision = WikiRevision(
        page_id=page.id,
        title=page.title,
        content=page.content,
        edited_by=user_id,
    )
    db.add(revision)

    if data.title is not None:
        page.title = data.title
    if data.content is not None:
        page.content = data.content
    await db.flush()
    return page


async def get_page_by_slug(db: AsyncSession, slug: str) -> WikiPage:
    result = await db.execute(select(WikiPage).where(WikiPage.slug == slug))
    page = result.scalar_one_or_none()
    if not page:
        raise NotFoundError("Seite nicht gefunden")
    return page


async def get_page_tree(db: AsyncSession) -> list[WikiPageTreeItem]:
    result = await db.execute(select(WikiPage).order_by(WikiPage.title))
    pages = list(result.scalars().all())

    page_map: dict[str, WikiPageTreeItem] = {}
    for p in pages:
        page_map[p.id] = WikiPageTreeItem(
            id=p.id, slug=p.slug, title=p.title, parent_id=p.parent_id
        )

    roots: list[WikiPageTreeItem] = []
    for item in page_map.values():
        if item.parent_id and item.parent_id in page_map:
            page_map[item.parent_id].children.append(item)
        else:
            roots.append(item)
    return roots


async def get_revisions(db: AsyncSession, slug: str) -> list[WikiRevisionRead]:
    page = await get_page_by_slug(db, slug)
    result = await db.execute(
        select(WikiRevision)
        .options(joinedload(WikiRevision.editor))
        .where(WikiRevision.page_id == page.id)
        .order_by(WikiRevision.created_at.desc())
    )
    revisions = result.scalars().all()
    return [
        WikiRevisionRead(
            id=r.id,
            page_id=r.page_id,
            title=r.title,
            content=r.content,
            edited_by=r.edited_by,
            editor_name=r.editor.display_name,
            created_at=r.created_at,
        )
        for r in revisions
    ]


async def rollback_page(
    db: AsyncSession, slug: str, revision_id: str, user_id: str
) -> WikiPage:
    page = await get_page_by_slug(db, slug)
    result = await db.execute(
        select(WikiRevision).where(
            WikiRevision.id == revision_id, WikiRevision.page_id == page.id
        )
    )
    revision = result.scalar_one_or_none()
    if not revision:
        raise NotFoundError("Revision nicht gefunden")

    current_revision = WikiRevision(
        page_id=page.id,
        title=page.title,
        content=page.content,
        edited_by=user_id,
    )
    db.add(current_revision)

    page.title = revision.title
    page.content = revision.content
    await db.flush()
    return page
