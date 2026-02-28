from datetime import datetime

from pydantic import BaseModel


class WikiPageCreate(BaseModel):
    title: str
    content: str = ""
    parent_id: str | None = None


class WikiPageUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class WikiPageRead(BaseModel):
    id: str
    slug: str
    title: str
    content: str
    parent_id: str | None
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WikiPageTreeItem(BaseModel):
    id: str
    slug: str
    title: str
    parent_id: str | None
    children: list["WikiPageTreeItem"] = []

    model_config = {"from_attributes": True}


class WikiRevisionRead(BaseModel):
    id: str
    page_id: str
    title: str
    content: str
    edited_by: str
    editor_name: str = ""
    created_at: datetime

    model_config = {"from_attributes": True}
