import base64
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import Select, asc, desc

T = TypeVar("T")


class CursorPage(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None = None
    has_more: bool = False


def encode_cursor(value: str, created_at: datetime) -> str:
    raw = f"{value}|{created_at.isoformat()}"
    return base64.urlsafe_b64encode(raw.encode()).decode()


def decode_cursor(cursor: str) -> tuple[str, datetime]:
    raw = base64.urlsafe_b64decode(cursor.encode()).decode()
    parts = raw.split("|", 1)
    return parts[0], datetime.fromisoformat(parts[1])


def apply_cursor_pagination(
    query: Select,
    id_column,
    created_at_column,
    cursor: str | None,
    limit: int = 50,
    newest_first: bool = True,
) -> Select:
    if cursor:
        cursor_id, cursor_time = decode_cursor(cursor)
        if newest_first:
            query = query.where(
                (created_at_column < cursor_time)
                | ((created_at_column == cursor_time) & (id_column < cursor_id))
            )
        else:
            query = query.where(
                (created_at_column > cursor_time)
                | ((created_at_column == cursor_time) & (id_column > cursor_id))
            )

    if newest_first:
        query = query.order_by(desc(created_at_column), desc(id_column))
    else:
        query = query.order_by(asc(created_at_column), asc(id_column))

    return query.limit(limit + 1)
