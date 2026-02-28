from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import NotFoundError
from app.models.gallery import Album, AlbumVisibility, Image
from app.schemas.gallery import AlbumCreate, AlbumRead
from app.utils.storage import to_url


async def create_album(db: AsyncSession, data: AlbumCreate, user_id: str) -> Album:
    album = Album(
        title=data.title,
        description=data.description,
        visibility=data.visibility,
        created_by=user_id,
    )
    db.add(album)
    await db.flush()
    return album


async def list_albums(db: AsyncSession) -> list[AlbumRead]:
    result = await db.execute(
        select(
            Album,
            func.count(Image.id).label("image_count"),
            func.min(Image.thumbnail_path).label("cover_thumbnail"),
        )
        .outerjoin(Image, Album.id == Image.album_id)
        .group_by(Album.id)
        .order_by(Album.created_at.desc())
    )
    albums = []
    for row in result.all():
        album, image_count, cover_thumbnail = row
        albums.append(
            AlbumRead(
                id=album.id,
                title=album.title,
                description=album.description,
                visibility=album.visibility,
                created_by=album.created_by,
                created_at=album.created_at,
                image_count=image_count,
                cover_thumbnail=to_url(cover_thumbnail),
            )
        )
    return albums


async def get_album(db: AsyncSession, album_id: str) -> Album:
    result = await db.execute(select(Album).where(Album.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise NotFoundError("Album nicht gefunden")
    return album


async def list_images(db: AsyncSession, album_id: str) -> list[Image]:
    await get_album(db, album_id)
    result = await db.execute(
        select(Image).where(Image.album_id == album_id).order_by(Image.created_at.desc())
    )
    return list(result.scalars().all())


async def create_image(
    db: AsyncSession,
    album_id: str,
    file_path: str,
    thumbnail_path: str,
    uploaded_by: str,
    caption: str | None = None,
) -> Image:
    image = Image(
        album_id=album_id,
        file_path=file_path,
        thumbnail_path=thumbnail_path,
        uploaded_by=uploaded_by,
        caption=caption,
    )
    db.add(image)
    await db.flush()
    return image


async def delete_image(db: AsyncSession, image_id: str) -> Image:
    result = await db.execute(select(Image).where(Image.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise NotFoundError("Bild nicht gefunden")
    await db.delete(image)
    await db.flush()
    return image
