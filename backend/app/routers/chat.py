from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.chat import ChannelCreate, ChannelRead, MessageCreate, MessageRead
from app.schemas.common import CursorPage
from app.services.chat_service import (
    create_channel,
    create_message,
    get_messages,
    list_user_channels,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.get("/channels", response_model=list[ChannelRead])
async def get_channels(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_user_channels(db, user.id)


@router.post("/channels", response_model=ChannelRead)
async def post_channel(
    data: ChannelCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await create_channel(db, data.name, data.type, user.id)


@router.get("/channels/{channel_id}/messages", response_model=CursorPage[MessageRead])
async def get_channel_messages(
    channel_id: str,
    cursor: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_messages(db, channel_id, cursor, limit)


@router.post("/channels/{channel_id}/messages", response_model=MessageRead)
async def post_message(
    channel_id: str,
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = await create_message(db, channel_id, user.id, data.content, data.parent_id)
    return MessageRead(
        id=msg.id,
        channel_id=msg.channel_id,
        sender_id=msg.sender_id,
        sender_name=msg.sender.display_name,
        sender_avatar=msg.sender.avatar_url,
        content=msg.content,
        parent_id=msg.parent_id,
        edited_at=msg.edited_at,
        created_at=msg.created_at,
    )
