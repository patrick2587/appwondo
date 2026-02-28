from datetime import datetime

from pydantic import BaseModel

from app.models.chat import ChannelType
from app.schemas.user import UserRead


class ChannelCreate(BaseModel):
    name: str
    type: ChannelType = ChannelType.PUBLIC


class ChannelRead(BaseModel):
    id: str
    name: str
    type: ChannelType
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageCreate(BaseModel):
    content: str
    parent_id: str | None = None


class MessageRead(BaseModel):
    id: str
    channel_id: str
    sender_id: str
    sender_name: str
    sender_avatar: str | None
    content: str
    parent_id: str | None
    edited_at: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
