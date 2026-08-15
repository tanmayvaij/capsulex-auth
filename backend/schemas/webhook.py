from pydantic import BaseModel, HttpUrl
from datetime import datetime

class WebhookCreate(BaseModel):
    url: HttpUrl
    events: list[str]

class WebhookUpdate(BaseModel):
    url: HttpUrl | None = None
    events: list[str]

class WebhookResponse(BaseModel):
    id: int
    project_id: int
    url: str
    secret: str
    events: list[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
