from pydantic import BaseModel
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str

class ProjectUpdate(BaseModel):
    allowed_origins: list[str] | None = None
    mail_config: dict | None = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    api_key: str
    developer_id: int
    allowed_origins: list[str]
    mail_config: dict
    created_at: datetime
    
    class Config:
        from_attributes = True

class DeveloperEmail(BaseModel):
    email: str

class AdminProjectResponse(ProjectResponse):
    developer: DeveloperEmail
    users_count: int = 0

    class Config:
        from_attributes = True
