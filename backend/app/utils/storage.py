import os
import uuid

import aiofiles

from app.config import settings


def get_upload_path(album_id: str, filename: str, is_thumbnail: bool = False) -> str:
    """Return a path relative to UPLOAD_DIR (e.g. 'album_id/originals/uuid.jpg')."""
    ext = os.path.splitext(filename)[1].lower()
    unique_name = f"{uuid.uuid4()}{ext}"
    subfolder = "thumbs" if is_thumbnail else "originals"
    relative_path = os.path.join(album_id, subfolder, unique_name)
    full_path = os.path.join(settings.UPLOAD_DIR, relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    return relative_path


def to_absolute(relative_path: str) -> str:
    return os.path.join(settings.UPLOAD_DIR, relative_path)


def to_url(relative_path: str | None) -> str | None:
    if not relative_path:
        return None
    return f"/api/gallery/uploads/{relative_path}"


async def save_upload(file_data: bytes, relative_path: str) -> None:
    full_path = to_absolute(relative_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    async with aiofiles.open(full_path, "wb") as f:
        await f.write(file_data)


def delete_file(relative_path: str) -> None:
    full_path = to_absolute(relative_path)
    if os.path.exists(full_path):
        os.remove(full_path)
