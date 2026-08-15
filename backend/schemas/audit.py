from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, Optional

class AuditLogResponse(BaseModel):
    id: int
    project_id: int
    user_id: Optional[str]
    event_type: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AnalyticsSummaryResponse(BaseModel):
    date: str
    signups: int
    logins: int
