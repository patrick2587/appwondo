import enum

from pydantic import BaseModel


class WSAction(str, enum.Enum):
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    SEND_MESSAGE = "send_message"
    TYPING = "typing"
    NEW_MESSAGE = "new_message"
    USER_TYPING = "user_typing"
    ERROR = "error"
    PONG = "pong"
    PING = "ping"


class WSEnvelope(BaseModel):
    action: WSAction
    channel_id: str | None = None
    payload: dict = {}
    request_id: str | None = None
