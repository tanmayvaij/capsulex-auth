from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SessionResponse(BaseModel):
    id: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_revoked: bool
    created_at: datetime
    last_active_at: datetime
    expires_at: Optional[datetime] = None
    is_current: bool = False

    class Config:
        from_attributes = True
