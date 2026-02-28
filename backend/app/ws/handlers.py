from sqlalchemy.ext.asyncio import AsyncSession

from app.services.chat_service import create_message, ensure_channel_member
from app.ws.manager import manager
from app.ws.protocol import WSAction, WSEnvelope


async def handle_subscribe(user_id: str, envelope: WSEnvelope, db: AsyncSession) -> dict | None:
    if not envelope.channel_id:
        return {"action": WSAction.ERROR, "payload": {"message": "channel_id fehlt"}}
    await ensure_channel_member(db, envelope.channel_id, user_id)
    manager.subscribe(user_id, envelope.channel_id)
    return None


async def handle_unsubscribe(user_id: str, envelope: WSEnvelope, db: AsyncSession) -> dict | None:
    if envelope.channel_id:
        manager.unsubscribe(user_id, envelope.channel_id)
    return None


async def handle_send_message(user_id: str, envelope: WSEnvelope, db: AsyncSession) -> dict | None:
    if not envelope.channel_id:
        return {"action": WSAction.ERROR, "payload": {"message": "channel_id fehlt"}}

    content = envelope.payload.get("content", "").strip()
    if not content:
        return {"action": WSAction.ERROR, "payload": {"message": "Nachricht darf nicht leer sein"}}

    parent_id = envelope.payload.get("parent_id")
    message = await create_message(db, envelope.channel_id, user_id, content, parent_id)

    broadcast = {
        "action": WSAction.NEW_MESSAGE,
        "channel_id": envelope.channel_id,
        "payload": {
            "id": message.id,
            "channel_id": message.channel_id,
            "sender_id": message.sender_id,
            "sender_name": message.sender.display_name,
            "sender_avatar": message.sender.avatar_url,
            "content": message.content,
            "parent_id": message.parent_id,
            "created_at": message.created_at.isoformat(),
        },
        "request_id": envelope.request_id,
    }
    await manager.broadcast_to_channel(envelope.channel_id, broadcast)
    return None


async def handle_typing(user_id: str, envelope: WSEnvelope, db: AsyncSession) -> dict | None:
    if not envelope.channel_id:
        return None
    broadcast = {
        "action": WSAction.USER_TYPING,
        "channel_id": envelope.channel_id,
        "payload": {"user_id": user_id},
    }
    await manager.broadcast_to_channel(envelope.channel_id, broadcast, exclude_user=user_id)
    return None


HANDLERS = {
    WSAction.SUBSCRIBE: handle_subscribe,
    WSAction.UNSUBSCRIBE: handle_unsubscribe,
    WSAction.SEND_MESSAGE: handle_send_message,
    WSAction.TYPING: handle_typing,
}
