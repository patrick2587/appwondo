from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.database import get_db
from app.models.user import Role, User
from app.schemas.wiki import (
    WikiPageCreate,
    WikiPageRead,
    WikiPageTreeItem,
    WikiPageUpdate,
    WikiRevisionRead,
)
from app.services.wiki_service import (
    create_page,
    get_page_by_slug,
    get_page_tree,
    get_revisions,
    rollback_page,
    update_page,
)

router = APIRouter(prefix="/api/wiki", tags=["wiki"])


@router.get("/pages", response_model=list[WikiPageTreeItem])
async def get_pages(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_page_tree(db)


@router.post("/pages", response_model=WikiPageRead)
async def post_page(
    data: WikiPageCreate,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await create_page(db, data, user.id)


@router.get("/pages/{slug}", response_model=WikiPageRead)
async def get_page(
    slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_page_by_slug(db, slug)


@router.put("/pages/{slug}", response_model=WikiPageRead)
async def put_page(
    slug: str,
    data: WikiPageUpdate,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    return await update_page(db, slug, data, user.id)


@router.get("/pages/{slug}/revisions", response_model=list[WikiRevisionRead])
async def get_page_revisions(
    slug: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_revisions(db, slug)


@router.post("/pages/{slug}/rollback/{revision_id}", response_model=WikiPageRead)
async def rollback(
    slug: str,
    revision_id: str,
    user: User = Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    return await rollback_page(db, slug, revision_id, user.id)
