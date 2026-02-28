import os

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_role
from app.config import settings
from app.database import get_db
from app.exceptions import BadRequestError
from app.models.user import Role, User
from app.schemas.gallery import AlbumCreate, AlbumRead, ImageRead, ImageUploadResponse
from app.services.gallery_service import (
    create_album,
    create_image,
    delete_image,
    get_album,
    list_albums,
    list_images,
)
from app.utils.storage import delete_file, get_upload_path, save_upload, to_absolute, to_url
from app.utils.thumbnails import generate_thumbnail

router = APIRouter(prefix="/api/gallery", tags=["gallery"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


@router.get("/albums", response_model=list[AlbumRead])
async def get_albums(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_albums(db)


@router.post("/albums", response_model=AlbumRead)
async def post_album(
    data: AlbumCreate,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    album = await create_album(db, data, user.id)
    return AlbumRead(
        id=album.id,
        title=album.title,
        description=album.description,
        visibility=album.visibility,
        created_by=album.created_by,
        created_at=album.created_at,
        image_count=0,
        cover_thumbnail=None,
    )


@router.get("/albums/{album_id}/images", response_model=list[ImageRead])
async def get_images(
    album_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    images = await list_images(db, album_id)
    return [
        ImageRead(
            id=img.id,
            album_id=img.album_id,
            file_path=to_url(img.file_path),
            thumbnail_path=to_url(img.thumbnail_path),
            uploaded_by=img.uploaded_by,
            caption=img.caption,
            created_at=img.created_at,
        )
        for img in images
    ]


@router.post("/albums/{album_id}/images", response_model=ImageUploadResponse)
async def upload_image(
    album_id: str,
    file: UploadFile = File(...),
    caption: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError(f"Dateityp nicht erlaubt. Erlaubt: {', '.join(ALLOWED_EXTENSIONS)}")

    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise BadRequestError(f"Datei zu gross (max {settings.MAX_UPLOAD_SIZE_MB} MB)")

    rel_path = get_upload_path(album_id, file.filename or "image.jpg")
    rel_thumb = get_upload_path(album_id, file.filename or "image.jpg", is_thumbnail=True)

    await save_upload(content, rel_path)
    generate_thumbnail(to_absolute(rel_path), to_absolute(rel_thumb))

    # Store relative paths in DB
    image = await create_image(db, album_id, rel_path, rel_thumb, user.id, caption)
    return ImageUploadResponse(
        id=image.id,
        file_path=to_url(image.file_path),
        thumbnail_path=to_url(image.thumbnail_path),
    )


@router.delete("/images/{image_id}")
async def remove_image(
    image_id: str,
    user: User = Depends(require_role(Role.VORSTAND)),
    db: AsyncSession = Depends(get_db),
):
    image = await delete_image(db, image_id)
    delete_file(image.file_path)
    delete_file(image.thumbnail_path)
    return {"detail": "Bild geloscht"}


@router.get("/uploads/{path:path}")
async def serve_upload(path: str):
    full_path = os.path.join(settings.UPLOAD_DIR, path)
    if not os.path.isfile(full_path):
        raise BadRequestError("Datei nicht gefunden")
    # Prevent path traversal
    if ".." in path:
        raise BadRequestError("Ungueltiger Pfad")
    return FileResponse(full_path)
