import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.user_connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.channel_subscribers: dict[str, set[str]] = defaultdict(set)
        self.ws_to_user: dict[WebSocket, str] = {}

    async def connect(self, ws: WebSocket, user_id: str) -> None:
        await ws.accept()
        self.user_connections[user_id].add(ws)
        self.ws_to_user[ws] = user_id

    def disconnect(self, ws: WebSocket) -> None:
        user_id = self.ws_to_user.pop(ws, None)
        if user_id:
            self.user_connections[user_id].discard(ws)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
                for channel_id in list(self.channel_subscribers.keys()):
                    self.channel_subscribers[channel_id].discard(user_id)

    def subscribe(self, user_id: str, channel_id: str) -> None:
        self.channel_subscribers[channel_id].add(user_id)

    def unsubscribe(self, user_id: str, channel_id: str) -> None:
        self.channel_subscribers[channel_id].discard(user_id)

    async def broadcast_to_channel(self, channel_id: str, message: dict, exclude_user: str | None = None) -> None:
        user_ids = self.channel_subscribers.get(channel_id, set())
        for user_id in user_ids:
            if user_id == exclude_user:
                continue
            for ws in self.user_connections.get(user_id, set()):
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def send_to_user(self, user_id: str, message: dict) -> None:
        for ws in self.user_connections.get(user_id, set()):
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()
