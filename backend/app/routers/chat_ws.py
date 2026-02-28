import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jwt import InvalidTokenError

from app.auth.jwt import decode_token
from app.database import async_session
from app.ws.handlers import HANDLERS
from app.ws.manager import manager
from app.ws.protocol import WSAction, WSEnvelope

router = APIRouter()


@router.websocket("/ws/chat")
async def chat_ws(ws: WebSocket, token: str = Query(...)):
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            await ws.close(code=4001, reason="Ungultiger Token-Typ")
            return
        user_id = payload.get("sub")
        if not user_id:
            await ws.close(code=4001, reason="Ungultiger Token")
            return
    except InvalidTokenError:
        await ws.close(code=4001, reason="Ungultiger Token")
        return

    await manager.connect(ws, user_id)

    try:
        while True:
            raw = await ws.receive_text()
            try:
                data = json.loads(raw)
                envelope = WSEnvelope(**data)
            except Exception:
                await ws.send_json(
                    {"action": WSAction.ERROR, "payload": {"message": "Ungultiges Nachrichtenformat"}}
                )
                continue

            if envelope.action == WSAction.PING:
                await ws.send_json({"action": WSAction.PONG})
                continue

            handler = HANDLERS.get(envelope.action)
            if not handler:
                await ws.send_json(
                    {"action": WSAction.ERROR, "payload": {"message": f"Unbekannte Aktion: {envelope.action}"}}
                )
                continue

            async with async_session() as db:
                try:
                    response = await handler(user_id, envelope, db)
                    await db.commit()
                    if response:
                        await ws.send_json(response)
                except Exception as e:
                    await db.rollback()
                    await ws.send_json(
                        {"action": WSAction.ERROR, "payload": {"message": str(e)}}
                    )

    except WebSocketDisconnect:
        manager.disconnect(ws)
    except Exception:
        manager.disconnect(ws)
