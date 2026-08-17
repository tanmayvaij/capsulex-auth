import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from typing import Any, List

from db.session import get_db
from models.developer import Developer
from models.project import Project
from models.webhook import Webhook
from models.config import SystemConfig
from schemas.developer import DeveloperCreate, DeveloperLogin, DeveloperResponse, DeveloperPasswordUpdate
from schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from schemas.webhook import WebhookCreate, WebhookResponse, WebhookUpdate
from schemas.user import Token, RefreshRequest
from schemas.config import SystemConfigPublic
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, ALGORITHM
from core.config import settings
from jose import jwt, JWTError
from api.deps import get_current_developer
from core.rate_limit import limiter

developer_router = APIRouter(prefix="/developer", tags=["developer"])

@developer_router.get("/auth/config", response_model=SystemConfigPublic)
async def get_public_config(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "allow_public_registration"))
    config = result.scalars().first()
    allow = config.value == "true" if config else True
    return {"allow_public_registration": allow}

@developer_router.post("/auth/register", response_model=DeveloperResponse)
@limiter.limit("5/minute")
async def register_developer(
    request: Request,
    dev_in: DeveloperCreate, 
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "allow_public_registration"))
    config = result.scalars().first()
    allow_public_registration = config.value == "true" if config else True
    
    if not allow_public_registration:
        raise HTTPException(
            status_code=403,
            detail="Public registration is currently disabled."
        )

    hashed_password = get_password_hash(dev_in.password)
    new_dev = Developer(
        email=dev_in.email,
        hashed_password=hashed_password
    )
    db.add(new_dev)
    try:
        await db.commit()
        await db.refresh(new_dev)
        return new_dev
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A developer with this email already exists."
        )

@developer_router.post("/auth/login")
@limiter.limit("5/minute")
async def login_developer_or_admin(
    request: Request,
    response: Response,
    dev_in: DeveloperLogin, 
    db: AsyncSession = Depends(get_db)
) -> Any:
    from models.admin import Admin
    
    # Check Admin first
    admin_result = await db.execute(select(Admin).where(Admin.email == dev_in.email))
    admin = admin_result.scalars().first()
    
    if admin and verify_password(dev_in.password, admin.hashed_password):
        access_token = create_access_token(
            subject=admin.id, 
            extra_claims={"role": "admin"}
        )
        refresh_token = create_refresh_token(subject=admin.id, extra_claims={"role": "admin"})
        
        response.set_cookie(key="admin_token", value=access_token, httponly=True, samesite="lax")
        response.set_cookie(key="admin_refresh_token", value=refresh_token, httponly=True, samesite="lax")
        
        return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "role": "admin"}
        
    # Check Developer
    result = await db.execute(select(Developer).where(Developer.email == dev_in.email))
    dev = result.scalars().first()
    
    if not dev or not verify_password(dev_in.password, dev.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not dev.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended"
        )
    
    access_token = create_access_token(
        subject=dev.id, 
        extra_claims={"role": "developer"}
    )
    refresh_token = create_refresh_token(subject=dev.id, extra_claims={"role": "developer"})
    
    response.set_cookie(key="developer_token", value=access_token, httponly=True, samesite="lax")
    response.set_cookie(key="developer_refresh_token", value=refresh_token, httponly=True, samesite="lax")
    
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token, "role": "developer"}

@developer_router.post("/auth/refresh", response_model=Token)
@limiter.limit("5/minute")
async def refresh_developer_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # Handle both developer and admin refreshes on this endpoint since login also unifies them,
    # or rely on frontend to call the right one.
    refresh_token_cookie = request.cookies.get("developer_refresh_token") or request.cookies.get("admin_refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Missing refresh token")
        
    try:
        payload = jwt.decode(refresh_token_cookie, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        subject = payload.get("sub")
        role = payload.get("role")
        if not subject or not role:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        access_token = create_access_token(
            subject=subject, 
            extra_claims={"role": role}
        )
        
        token_key = "admin_token" if role == "admin" else "developer_token"
        response.set_cookie(key=token_key, value=access_token, httponly=True, samesite="lax")
        
        return {"access_token": access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@developer_router.post("/auth/logout")
async def developer_logout(response: Response):
    response.delete_cookie("developer_token")
    response.delete_cookie("developer_refresh_token")
    response.delete_cookie("admin_token")
    response.delete_cookie("admin_refresh_token")
    return {"message": "Logged out successfully"}

@developer_router.get("/auth/me", response_model=DeveloperResponse)
async def get_me(current_dev: Developer = Depends(get_current_developer)) -> Any:
    return current_dev

@developer_router.patch("/auth/password")
async def update_password(
    password_in: DeveloperPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    if not verify_password(password_in.current_password, current_dev.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect current password"
        )
    
    current_dev.hashed_password = get_password_hash(password_in.new_password)
    db.add(current_dev)
    await db.commit()
    
    return {"message": "Password updated successfully"}

# --- Webhook Routes ---

@developer_router.post("/projects/{project_id}/webhooks", response_model=WebhookResponse)
async def create_webhook(
    project_id: int,
    webhook_in: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
):
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    url_str = str(webhook_in.url)
    existing = await db.execute(select(Webhook).where((Webhook.project_id == project_id) & (Webhook.url == url_str)))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="A webhook with this URL already exists in this project.")

    new_webhook = Webhook(
        project_id=project_id,
        url=url_str,
        events=webhook_in.events
    )
    db.add(new_webhook)
    await db.commit()
    await db.refresh(new_webhook)
    return new_webhook

@developer_router.get("/projects/{project_id}/webhooks", response_model=List[WebhookResponse])
async def get_webhooks(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
):
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Webhook).where(Webhook.project_id == project_id))
    return result.scalars().all()

@developer_router.delete("/projects/{project_id}/webhooks/{webhook_id}")
async def delete_webhook(
    project_id: int,
    webhook_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
):
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Webhook).where((Webhook.id == webhook_id) & (Webhook.project_id == project_id)))
    webhook = result.scalars().first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    await db.delete(webhook)
    await db.commit()
    return {"message": "Webhook deleted successfully"}

@developer_router.patch("/projects/{project_id}/webhooks/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    project_id: int,
    webhook_id: int,
    webhook_in: WebhookUpdate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
):
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Webhook).where((Webhook.id == webhook_id) & (Webhook.project_id == project_id)))
    webhook = result.scalars().first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    if webhook_in.url is not None:
        url_str = str(webhook_in.url)
        if url_str != webhook.url:
            existing = await db.execute(select(Webhook).where((Webhook.project_id == project_id) & (Webhook.url == url_str)))
            if existing.scalars().first():
                raise HTTPException(status_code=400, detail="A webhook with this URL already exists in this project.")
            webhook.url = url_str

    webhook.events = webhook_in.events
    await db.commit()
    await db.refresh(webhook)
    return webhook

@developer_router.get("/projects", response_model=List[ProjectResponse])
async def get_my_projects(
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    result = await db.execute(
        select(Project)
        .where(Project.developer_id == current_dev.id)
        .order_by(Project.created_at.desc())
    )
    return result.scalars().all()

@developer_router.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    api_key = f"proj_{secrets.token_urlsafe(32)}"
    new_project = Project(
        name=project_in.name,
        api_key=api_key,
        developer_id=current_dev.id,
        allowed_origins=[],
        mail_config={"provider": "none"}
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project
from schemas.user import UserResponse, UserStatusUpdate
from models.user import User

@developer_router.get("/projects/{project_id}/users", response_model=List[UserResponse])
async def get_project_users(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # First verify the project belongs to the developer
    result = await db.execute(
        select(Project).where(
            (Project.id == project_id) & (Project.developer_id == current_dev.id)
        )
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
        
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles))
        .where(User.project_id == project_id)
        .order_by(User.created_at.desc())
    )
    return result.scalars().all()

@developer_router.delete("/projects/{project_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_user(
    project_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> None:
    result = await db.execute(
        select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id))
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(User).where((User.id == user_id) & (User.project_id == project_id)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await db.delete(user)
    await db.commit()
    return None

@developer_router.patch("/projects/{project_id}/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    project_id: int,
    user_id: int,
    status_in: UserStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    result = await db.execute(
        select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id))
    )
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(User).where((User.id == user_id) & (User.project_id == project_id)))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = status_in.is_active
    await db.commit()
    await db.refresh(user)
    
    if not user.is_active:
        from services.webhook import WebhookService
        user_data = UserResponse.model_validate(user).model_dump()
        user_data["created_at"] = user_data["created_at"].isoformat()
        if user_data["last_signed_in"]:
            user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
            
        background_tasks.add_task(
            WebhookService.dispatch_event,
            db, project_id, "user.suspended", user_data
        )
        
    return user

from schemas.session import SessionResponse

@developer_router.get("/projects/{project_id}/users/{user_id}/sessions", response_model=List[SessionResponse])
async def get_user_sessions(
    project_id: int,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    from models.user import User
    result = await db.execute(select(User).where((User.id == user_id) & (User.project_id == project_id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="User not found")

    from models.session import Session
    from sqlalchemy import desc
    result = await db.execute(
        select(Session)
        .where(Session.user_id == user_id)
        .order_by(desc(Session.last_active_at))
    )
    return result.scalars().all()

@developer_router.delete("/projects/{project_id}/users/{user_id}/sessions/{session_id}")
async def revoke_user_session(
    project_id: int,
    user_id: str,
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    from models.user import User
    result = await db.execute(select(User).where((User.id == user_id) & (User.project_id == project_id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="User not found")

    from models.session import Session
    result = await db.execute(select(Session).where((Session.id == session_id) & (Session.user_id == user_id)))
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.is_revoked = True
    await db.commit()
    return {"message": "Session revoked"}

@developer_router.delete("/projects/{project_id}/users/{user_id}/sessions")
async def revoke_all_user_sessions(
    project_id: int,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    from models.user import User
    result = await db.execute(select(User).where((User.id == user_id) & (User.project_id == project_id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="User not found")

    from models.session import Session
    result = await db.execute(select(Session).where(Session.user_id == user_id))
    sessions = result.scalars().all()
    
    for session in sessions:
        session.is_revoked = True
        
    await db.commit()
    return {"message": "All sessions revoked"}
@developer_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    result = await db.execute(
        select(Project).where(
            (Project.id == project_id) & 
            (Project.developer_id == current_dev.id)
        )
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@developer_router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    result = await db.execute(
        select(Project).where(
            (Project.id == project_id) & 
            (Project.developer_id == current_dev.id)
        )
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if project_update.allowed_origins is not None:
        project.allowed_origins = project_update.allowed_origins
    if project_update.mail_config is not None:
        project.mail_config = project_update.mail_config
    if project_update.allow_public_registration is not None:
        project.allow_public_registration = project_update.allow_public_registration
        
    await db.commit()
    await db.refresh(project)
    return project

@developer_router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> None:
    result = await db.execute(
        select(Project).where(
            (Project.id == project_id) & 
            (Project.developer_id == current_dev.id)
        )
    )
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete all associated users first
    await db.execute(User.__table__.delete().where(User.project_id == project_id))
    
    await db.delete(project)
    await db.commit()

# --- Analytics & Audit Logs ---
from models.audit import AuditLog
from schemas.audit import AuditLogResponse, AnalyticsSummaryResponse

@developer_router.get("/projects/{project_id}/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    project_id: int,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
):
    # Verify ownership
    res = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.project_id == project_id)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return result.scalars().all()

@developer_router.get("/projects/{project_id}/analytics/summary", response_model=List[AnalyticsSummaryResponse])
async def get_analytics_summary(
    project_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
):
    # Verify ownership
    res = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not res.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    # Fetch last `days` of logs
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    result = await db.execute(
        select(AuditLog)
        .where((AuditLog.project_id == project_id) & (AuditLog.created_at >= cutoff))
    )
    logs = result.scalars().all()
    
    # Aggregate in Python
    from collections import defaultdict
    summary = defaultdict(lambda: {"signups": 0, "logins": 0})
    
    for log in logs:
        # Group by YYYY-MM-DD
        date_str = log.created_at.strftime("%Y-%m-%d")
        if log.event_type == "user.created":
            summary[date_str]["signups"] += 1
        elif log.event_type == "user.login.success":
            summary[date_str]["logins"] += 1
            
    # Generate list of last N days, even if empty, to make charts look nice
    chart_data = []
    for i in range(days - 1, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        chart_data.append(
            AnalyticsSummaryResponse(
                date=d,
                signups=summary[d]["signups"],
                logins=summary[d]["logins"]
            )
        )
        
    return chart_data

# ==========================================
# ROLES & PERMISSIONS (RBAC)
# ==========================================
from schemas.rbac import RoleCreate, RoleResponse, RoleUpdate, UserRoleUpdate
from models.rbac import Role, Permission
from sqlalchemy.orm import selectinload
import uuid

@developer_router.get("/projects/{project_id}/roles", response_model=List[RoleResponse])
async def get_project_roles(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.project_id == project_id)
    )
    return result.scalars().all()

@developer_router.post("/projects/{project_id}/roles", response_model=RoleResponse)
async def create_project_role(
    project_id: int,
    role_in: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check if role exists
    result = await db.execute(select(Role).where((Role.project_id == project_id) & (Role.name == role_in.name)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Role with this name already exists")
        
    perms = []
    # Process permissions
    for action in role_in.permissions:
        # Get or create permission
        perm_result = await db.execute(select(Permission).where((Permission.project_id == project_id) & (Permission.action == action)))
        perm = perm_result.scalars().first()
        if not perm:
            perm = Permission(id=f"prm_{uuid.uuid4().hex[:16]}", project_id=project_id, action=action)
            db.add(perm)
        perms.append(perm)
        
    new_role = Role(
        id=f"rol_{uuid.uuid4().hex[:16]}",
        project_id=project_id,
        name=role_in.name,
        description=role_in.description,
        permissions=perms
    )
    db.add(new_role)
        
    await db.commit()
    await db.refresh(new_role)
    # Eager load permissions for response
    result = await db.execute(select(Role).options(selectinload(Role.permissions)).where(Role.id == new_role.id))
    return result.scalars().first()

@developer_router.put("/projects/{project_id}/roles/{role_id}", response_model=RoleResponse)
async def update_project_role(
    project_id: int,
    role_id: str,
    role_in: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Role).options(selectinload(Role.permissions)).where((Role.id == role_id) & (Role.project_id == project_id)))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    if role_in.name is not None and role_in.name != role.name:
        # Check name collision
        name_check = await db.execute(select(Role).where((Role.project_id == project_id) & (Role.name == role_in.name)))
        if name_check.scalars().first():
            raise HTTPException(status_code=400, detail="Role with this name already exists")
        role.name = role_in.name
        
    if role_in.description is not None:
        role.description = role_in.description
        
    if role_in.permissions is not None:
        role.permissions = [] # Clear existing
        for action in role_in.permissions:
            perm_result = await db.execute(select(Permission).where((Permission.project_id == project_id) & (Permission.action == action)))
            perm = perm_result.scalars().first()
            if not perm:
                perm = Permission(id=f"prm_{uuid.uuid4().hex[:16]}", project_id=project_id, action=action)
                db.add(perm)
            role.permissions.append(perm)
            
    await db.commit()
    await db.refresh(role)
    return role

@developer_router.delete("/projects/{project_id}/roles/{role_id}")
async def delete_project_role(
    project_id: int,
    role_id: str,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> dict:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(Role).where((Role.id == role_id) & (Role.project_id == project_id)))
    role = result.scalars().first()
    
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    await db.delete(role)
    await db.commit()
    return {"message": "Role deleted successfully"}

@developer_router.put("/projects/{project_id}/users/{user_id}/roles")
async def assign_user_roles(
    project_id: int,
    user_id: str,
    roles_in: UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_dev: Developer = Depends(get_current_developer)
) -> Any:
    # Verify project ownership
    result = await db.execute(select(Project).where((Project.id == project_id) & (Project.developer_id == current_dev.id)))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Project not found")

    from models.user import User
    result = await db.execute(select(User).options(selectinload(User.roles)).where((User.id == user_id) & (User.project_id == project_id)))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Fetch actual roles
    roles = []
    for role_name in roles_in.roles:
        r_result = await db.execute(select(Role).where((Role.project_id == project_id) & (Role.name == role_name)))
        role = r_result.scalars().first()
        if role:
            roles.append(role)
            
    user.roles = roles
    await db.commit()
    return {"message": "Roles updated successfully"}
