from sqlalchemy.ext.asyncio import AsyncSession
from models.audit import AuditLog
from typing import Optional

class AuditService:
    @staticmethod
    async def log_event(
        db: AsyncSession,
        project_id: int,
        event_type: str,
        user_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        audit_log = AuditLog(
            project_id=project_id,
            user_id=user_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata_=metadata or {}
        )
        db.add(audit_log)
        await db.commit()
