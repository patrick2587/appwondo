from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.exceptions import ForbiddenError, NotFoundError
from app.models.chat import ChatChannel, ChatChannelMember, ChatMessage, ChannelType
from app.models.user import User
from app.pagination import apply_cursor_pagination, encode_cursor
from app.schemas.chat import MessageRead
from app.schemas.common import CursorPage


async def create_channel(
    db: AsyncSession, name: str, channel_type: ChannelType, user_id: str
) -> ChatChannel:
    channel = ChatChannel(name=name, type=channel_type, created_by=user_id)
    db.add(channel)
    await db.flush()
    member = ChatChannelMember(channel_id=channel.id, user_id=user_id)
    db.add(member)
    await db.flush()
    return channel


async def list_user_channels(db: AsyncSession, user_id: str) -> list[ChatChannel]:
    result = await db.execute(
        select(ChatChannel)
        .join(ChatChannelMember, ChatChannel.id == ChatChannelMember.channel_id)
        .where(
            (ChatChannelMember.user_id == user_id) | (ChatChannel.type == ChannelType.PUBLIC)
        )
        .distinct()
        .order_by(ChatChannel.name)
    )
    return list(result.scalars().all())


async def get_channel(db: AsyncSession, channel_id: str) -> ChatChannel:
    result = await db.execute(select(ChatChannel).where(ChatChannel.id == channel_id))
    channel = result.scalar_one_or_none()
    if not channel:
        raise NotFoundError("Kanal nicht gefunden")
    return channel


async def get_messages(
    db: AsyncSession, channel_id: str, cursor: str | None = None, limit: int = 50
) -> CursorPage[MessageRead]:
    query = (
        select(ChatMessage)
        .options(joinedload(ChatMessage.sender))
        .where(ChatMessage.channel_id == channel_id)
    )
    query = apply_cursor_pagination(
        query, ChatMessage.id, ChatMessage.created_at, cursor, limit, newest_first=True
    )
    result = await db.execute(query)
    messages = list(result.scalars().all())

    has_more = len(messages) > limit
    if has_more:
        messages = messages[:limit]

    items = [
        MessageRead(
            id=m.id,
            channel_id=m.channel_id,
            sender_id=m.sender_id,
            sender_name=m.sender.display_name,
            sender_avatar=m.sender.avatar_url,
            content=m.content,
            parent_id=m.parent_id,
            edited_at=m.edited_at,
            created_at=m.created_at,
        )
        for m in messages
    ]

    next_cursor = None
    if has_more and messages:
        last = messages[-1]
        next_cursor = encode_cursor(last.id, last.created_at)

    return CursorPage(items=items, next_cursor=next_cursor, has_more=has_more)


async def create_message(
    db: AsyncSession, channel_id: str, sender_id: str, content: str, parent_id: str | None = None
) -> ChatMessage:
    await get_channel(db, channel_id)
    message = ChatMessage(
        channel_id=channel_id,
        sender_id=sender_id,
        content=content,
        parent_id=parent_id,
    )
    db.add(message)
    await db.flush()

    result = await db.execute(
        select(ChatMessage)
        .options(joinedload(ChatMessage.sender))
        .where(ChatMessage.id == message.id)
    )
    return result.scalar_one()


async def ensure_channel_member(db: AsyncSession, channel_id: str, user_id: str) -> None:
    channel = await get_channel(db, channel_id)
    if channel.type == ChannelType.PUBLIC:
        result = await db.execute(
            select(ChatChannelMember).where(
                ChatChannelMember.channel_id == channel_id,
                ChatChannelMember.user_id == user_id,
            )
        )
        if not result.scalar_one_or_none():
            db.add(ChatChannelMember(channel_id=channel_id, user_id=user_id))
            await db.flush()
        return

    result = await db.execute(
        select(ChatChannelMember).where(
            ChatChannelMember.channel_id == channel_id,
            ChatChannelMember.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise ForbiddenError("Kein Zugriff auf diesen Kanal")
