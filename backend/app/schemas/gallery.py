from datetime import datetime

from pydantic import BaseModel

from app.models.gallery import AlbumVisibility


class AlbumCreate(BaseModel):
    title: str
    description: str | None = None
    visibility: AlbumVisibility = AlbumVisibility.MEMBERS_ONLY


class AlbumRead(BaseModel):
    id: str
    title: str
    description: str | None
    visibility: AlbumVisibility
    created_by: str
    created_at: datetime
    image_count: int = 0
    cover_thumbnail: str | None = None

    model_config = {"from_attributes": True}


class ImageRead(BaseModel):
    id: str
    album_id: str
    file_path: str
    thumbnail_path: str
    uploaded_by: str
    caption: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ImageUploadResponse(BaseModel):
    id: str
    file_path: str
    thumbnail_path: str
