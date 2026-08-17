import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_
from typing import Any, List
from datetime import datetime, timedelta, timezone

from db.session import get_db
from schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, UserAdminResponse, 
    UserStatusUpdate, VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest,
    SendVerificationEmailRequest, RefreshRequest, OTPRequest, OTPVerifyRequest
)
from schemas.project import ProjectCreate, ProjectResponse, AdminProjectResponse
from models.user import User
from models.project import Project
from models.admin import Admin
from models.config import SystemConfig
from schemas.admin import AdminLogin, AdminResponse, AdminPasswordUpdate, AdminSettingsUpdate, AdminSetup
from schemas.config import SystemConfigPublic, SystemConfigUpdate
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, ALGORITHM
from jose import jwt, JWTError
from core.config import settings
from api.deps import get_current_user, get_project_from_api_key, get_current_admin
from services.email import get_email_service, BaseEmailService
from services.audit import AuditService
from core.rate_limit import limiter

router = APIRouter()

# --- Auth Routes ---
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key)
) -> Any:
    if not project.allow_public_registration:
        raise HTTPException(
            status_code=403,
            detail="Public registration is disabled for this project."
        )

    hashed_password = get_password_hash(user_in.password)
    verification_token = secrets.token_urlsafe(32)
    
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        project_id=project.id,
        verification_token=verification_token,
        user_metadata=user_in.user_metadata or {}
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        
        # Log event
        await AuditService.log_event(
            db=db,
            project_id=project.id,
            event_type="user.created",
            user_id=str(new_user.id),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        
        return new_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists in this project."
        )

@auth_router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    user_in: UserLogin, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key)
) -> Any:
    from sqlalchemy.orm import selectinload
    from models.rbac import Role
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(
            and_(User.email == user_in.email, User.project_id == project.id)
        )
    )
    user = result.scalars().first()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
        if user:
            from services.webhook import WebhookService
            user_data = UserResponse.model_validate(user).model_dump()
            user_data["created_at"] = user_data["created_at"].isoformat()
            if user_data["last_signed_in"]:
                user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
            background_tasks.add_task(WebhookService.dispatch_event, db, project.id, "user.login.failed", user_data)
            
            # Log failure
            await AuditService.log_event(
                db=db,
                project_id=project.id,
                event_type="user.login.failed",
                user_id=str(user.id),
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
                metadata={"reason": "Incorrect password"}
            )
            
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended"
        )
    
    from sqlalchemy.sql import func
    user.last_signed_in = func.now()
    await db.commit()
    
    from services.webhook import WebhookService
    user_data = UserResponse.model_validate(user).model_dump()
    user_data["created_at"] = user_data["created_at"].isoformat()
    if user_data["last_signed_in"]:
        user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
    background_tasks.add_task(WebhookService.dispatch_event, db, project.id, "user.login.success", user_data)
    
    # Log success
    await AuditService.log_event(
        db=db,
        project_id=project.id,
        event_type="user.login.success",
        user_id=str(user.id),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    from models.session import Session
    from datetime import datetime, timezone, timedelta
    from core.security import REFRESH_TOKEN_EXPIRE_DAYS
    
    new_session = Session(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    # Extract roles and permissions
    roles = []
    permissions = []
    for r in user.roles:
        roles.append(r.name)
        for p in r.permissions:
            if p.action not in permissions:
                permissions.append(p.action)
                
    extra_claims = {"roles": roles, "permissions": permissions}
    access_token = create_access_token(subject=user.id, sid=new_session.id, extra_claims=extra_claims)
    refresh_token = create_refresh_token(subject=user.id, sid=new_session.id)
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@auth_router.post("/refresh", response_model=Token)
@limiter.limit("5/minute")
async def refresh_user_token(
    request: Request,
    refresh_req: RefreshRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    try:
        payload = jwt.decode(refresh_req.refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        subject = payload.get("sub")
        sid = payload.get("sid")
        if not subject:
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        if sid:
            from models.session import Session
            from sqlalchemy import select
            from datetime import datetime, timezone
            result = await db.execute(select(Session).where(Session.id == sid))
            session = result.scalars().first()
            if not session or session.is_revoked:
                raise HTTPException(status_code=401, detail="Session has been revoked")
            
            session.last_active_at = datetime.now(timezone.utc)
            await db.commit()
            
        # Fetch user roles for the new access token
        from sqlalchemy.orm import selectinload
        from models.rbac import Role
        user_result = await db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.id == subject)
        )
        user = user_result.scalars().first()
        
        extra_claims = {}
        if user:
            roles = []
            permissions = []
            for r in user.roles:
                roles.append(r.name)
                for p in r.permissions:
                    if p.action not in permissions:
                        permissions.append(p.action)
            extra_claims = {"roles": roles, "permissions": permissions}
            
        access_token = create_access_token(subject=subject, sid=sid, extra_claims=extra_claims)
        return {"access_token": access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

from schemas.user import UserMetadataUpdate

@auth_router.patch("/me/metadata", response_model=UserResponse)
@limiter.limit("10/minute")
async def update_my_metadata(
    request: Request,
    metadata_in: UserMetadataUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    current_user.user_metadata = {**(current_user.user_metadata or {}), **metadata_in.user_metadata}
    await db.commit()
    await db.refresh(current_user)
    return current_user

from schemas.session import SessionResponse
from typing import List

@auth_router.get("/me/sessions", response_model=List[SessionResponse])
async def get_my_sessions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    from models.session import Session
    from sqlalchemy import select, desc
    
    result = await db.execute(
        select(Session)
        .where(Session.user_id == current_user.id)
        .order_by(desc(Session.last_active_at))
    )
    sessions = result.scalars().all()
    
    response = []
    current_sid = getattr(request.state, 'sid', None)
    
    for session in sessions:
        sess_dict = session.__dict__.copy()
        sess_dict["is_current"] = (session.id == current_sid)
        response.append(SessionResponse(**sess_dict))
        
    return response

@auth_router.delete("/me/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    from models.session import Session
    from sqlalchemy import select
    
    result = await db.execute(
        select(Session).where(Session.id == session_id, Session.user_id == current_user.id)
    )
    session = result.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.is_revoked = True
    await db.commit()
    return {"message": "Session revoked"}

@auth_router.delete("/me/sessions")
async def revoke_all_other_sessions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    from models.session import Session
    from sqlalchemy import select
    
    current_sid = getattr(request.state, 'sid', None)
    
    result = await db.execute(
        select(Session).where(Session.user_id == current_user.id)
    )
    sessions = result.scalars().all()
    
    revoked_count = 0
    for session in sessions:
        if session.id != current_sid and not session.is_revoked:
            session.is_revoked = True
            revoked_count += 1
            
    if revoked_count > 0:
        await db.commit()
        
    return {"message": f"Revoked {revoked_count} other sessions"}

@auth_router.delete("/me")
@limiter.limit("3/minute")
async def delete_me(
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    from services.webhook import WebhookService
    user_data = UserResponse.model_validate(current_user).model_dump()
    user_data["created_at"] = user_data["created_at"].isoformat()
    if user_data["last_signed_in"]:
        user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
    
    project_id = current_user.project_id
    
    await db.delete(current_user)
    await db.commit()
    
    background_tasks.add_task(
        WebhookService.dispatch_event,
        db, project_id, "user.deleted", user_data
    )
    
    return {"message": "Account deleted successfully"}

@auth_router.post("/send-verification-email")
@limiter.limit("3/minute")
async def send_verification_email(
    request: Request,
    req: SendVerificationEmailRequest,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key),
    email_service: BaseEmailService = Depends(get_email_service)
) -> Any:
    result = await db.execute(
        select(User).where(and_(User.email == req.email, User.project_id == project.id))
    )
    user = result.scalars().first()
    
    if not user:
        # Don't leak whether the user exists
        return {"message": "If the user exists, a verification email has been sent."}
        
    if user.is_email_verified:
        return {"message": "Email is already verified."}
        
    if not user.verification_token:
        user.verification_token = secrets.token_urlsafe(32)
        await db.commit()
        
    await email_service.send_verification_email(user.email, user.verification_token)
    return {"message": "If the user exists, a verification email has been sent."}

@auth_router.post("/verify-email")
@limiter.limit("3/minute")
async def verify_email(
    request: Request,
    req: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.verification_token == req.token))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    user.is_email_verified = True
    user.verification_token = None
    await db.commit()
    return {"message": "Email verified successfully"}

@auth_router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    req: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key),
    email_service: BaseEmailService = Depends(get_email_service)
) -> Any:
    result = await db.execute(
        select(User).where(and_(User.email == req.email, User.project_id == project.id))
    )
    user = result.scalars().first()
    
    # We shouldn't reveal if user exists, but we generate token if they do
    if user:
        reset_token = secrets.token_urlsafe(32)
        user.reset_password_token = reset_token
        user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        await email_service.send_password_reset_email(user.email, reset_token)
        
    return {"message": "If that email is registered, a password reset link has been sent."}

@auth_router.post("/reset-password")
@limiter.limit("3/minute")
async def reset_password(
    request: Request,
    req: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(User).where(User.reset_password_token == req.token))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token")
        
    # Check if expired
    if user.reset_password_expires_at is None or user.reset_password_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
        
    user.hashed_password = get_password_hash(req.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    await db.commit()
    
    from services.webhook import WebhookService
    user_data = UserResponse.model_validate(user).model_dump()
    user_data["created_at"] = user_data["created_at"].isoformat()
    if user_data["last_signed_in"]:
        user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
    background_tasks.add_task(WebhookService.dispatch_event, db, user.project_id, "user.password.reset", user_data)
    
    return {"message": "Password has been reset successfully"}

@auth_router.post("/otp/request")
@limiter.limit("5/minute")
async def request_otp(
    request: Request,
    req: OTPRequest,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key),
    email_service: BaseEmailService = Depends(get_email_service)
) -> Any:
    # Look up user
    result = await db.execute(select(User).where(and_(User.email == req.email, User.project_id == project.id)))
    user = result.scalars().first()
    
    if not user:
        # Create user without password
        user = User(
            email=req.email,
            project_id=project.id,
            hashed_password=None,
            is_email_verified=False
        )
        db.add(user)
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    # Generate 6-digit numeric OTP
    otp_code = ''.join(secrets.choice(string.digits) for _ in range(6))
    user.otp_code = otp_code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.commit()
    await email_service.send_otp_email(user.email, otp_code)
    
    return {"message": "If that email is registered, an OTP has been sent."}

@auth_router.post("/otp/verify")
@limiter.limit("10/minute")
async def verify_otp(
    request: Request,
    response: Response,
    req: OTPVerifyRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key)
) -> Any:
    from sqlalchemy.orm import selectinload
    from models.rbac import Role
    result = await db.execute(
        select(User)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .where(and_(User.email == req.email, User.project_id == project.id))
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or OTP")
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")
        
    if not user.otp_code or user.otp_code != req.otp_code:
        from services.webhook import WebhookService
        user_data = UserResponse.model_validate(user).model_dump()
        user_data["created_at"] = user_data["created_at"].isoformat()
        if user_data["last_signed_in"]:
            user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
        background_tasks.add_task(WebhookService.dispatch_event, db, project.id, "user.login.failed", user_data)
        
        # Log failure
        await AuditService.log_event(
            db=db,
            project_id=project.id,
            event_type="user.login.failed",
            user_id=str(user.id),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            metadata={"reason": "Invalid email or OTP"}
        )
        
        raise HTTPException(status_code=401, detail="Invalid email or OTP")
        
    if user.otp_expires_at is None or user.otp_expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    was_verified = user.is_email_verified
    
    # Valid OTP
    user.otp_code = None
    user.otp_expires_at = None
    user.is_email_verified = True
    user.last_signed_in = datetime.now(timezone.utc)
    
    if req.user_metadata:
        user.user_metadata = {**(user.user_metadata or {}), **req.user_metadata}

    await db.commit()
    
    if not was_verified:
        from services.webhook import WebhookService
        user_data = UserResponse.model_validate(user).model_dump()
        user_data["created_at"] = user_data["created_at"].isoformat()
        if user_data["last_signed_in"]:
            user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
            
        background_tasks.add_task(
            WebhookService.dispatch_event,
            db, project.id, "user.created", user_data
        )
        
    user_data = UserResponse.model_validate(user).model_dump()
    user_data["created_at"] = user_data["created_at"].isoformat()
    if user_data["last_signed_in"]:
        user_data["last_signed_in"] = user_data["last_signed_in"].isoformat()
    background_tasks.add_task(WebhookService.dispatch_event, db, project.id, "user.login.success", user_data)
    
    # Log success
    await AuditService.log_event(
        db=db,
        project_id=project.id,
        event_type="user.login.success",
        user_id=str(user.id),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    # Generate tokens
    from models.session import Session
    from datetime import datetime, timezone, timedelta
    from core.security import REFRESH_TOKEN_EXPIRE_DAYS
    
    new_session = Session(
        user_id=user.id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(new_session)
    await db.commit()
    await db.refresh(new_session)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) if hasattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES') else None
    access_token = create_access_token(
        subject=user.id,
        extra_claims={"role": "user", "project_id": project.id},
        expires_delta=access_token_expires,
        sid=new_session.id
    )
    
    refresh_token = create_refresh_token(
        subject=user.id,
        extra_claims={"role": "user", "project_id": project.id},
        sid=new_session.id
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user)
    }

router.include_router(auth_router)


# --- Admin Auth Routes ---
admin_auth_router = APIRouter(prefix="/admin/auth", tags=["admin_auth"])

@admin_auth_router.get("/has-admin")
async def has_admin(db: AsyncSession = Depends(get_db)) -> Any:
    result = await db.execute(select(Admin).limit(1))
    admin = result.scalars().first()
    return {"has_admin": admin is not None}

@admin_auth_router.post("/setup")
async def setup_admin(
    admin_in: AdminSetup,
    db: AsyncSession = Depends(get_db)
) -> Any:
    result = await db.execute(select(Admin).limit(1))
    existing_admin = result.scalars().first()
    
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin already exists. Setup is locked."
        )
        
    hashed_password = get_password_hash(admin_in.password)
    new_admin = Admin(
        email=admin_in.email,
        hashed_password=hashed_password
    )
    db.add(new_admin)
    await db.commit()
    
    return {"message": "Admin created successfully"}

@admin_auth_router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def admin_login(
    request: Request,
    response: Response,
    admin_in: AdminLogin, 
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(Admin).where(Admin.email == admin_in.email))
    admin = result.scalars().first()
    
    if not admin or not verify_password(admin_in.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = create_access_token(subject=admin.id, extra_claims={"role": "admin"})
    refresh_token = create_refresh_token(subject=admin.id, extra_claims={"role": "admin"})
    
    response.set_cookie(key="admin_token", value=access_token, httponly=True, samesite="lax")
    response.set_cookie(key="admin_refresh_token", value=refresh_token, httponly=True, samesite="lax")
    
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}

@admin_auth_router.post("/refresh", response_model=Token)
@limiter.limit("5/minute")
async def refresh_admin_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    refresh_token_cookie = request.cookies.get("admin_refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Missing refresh token")
        
    try:
        payload = jwt.decode(refresh_token_cookie, settings.SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        subject = payload.get("sub")
        role = payload.get("role")
        if not subject or role != "admin":
            raise HTTPException(status_code=401, detail="Invalid token payload")
            
        access_token = create_access_token(subject=subject, extra_claims={"role": "admin"})
        response.set_cookie(key="admin_token", value=access_token, httponly=True, samesite="lax")
        return {"access_token": access_token, "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@admin_auth_router.post("/logout")
async def admin_logout(response: Response):
    response.delete_cookie("admin_token")
    response.delete_cookie("admin_refresh_token")
    return {"message": "Logged out successfully"}

@admin_auth_router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    from sqlalchemy import func
    from models.developer import Developer
    from models.project import Project
    from models.user import User
    
    devs_count = await db.scalar(select(func.count()).select_from(Developer))
    projects_count = await db.scalar(select(func.count()).select_from(Project))
    users_count = await db.scalar(select(func.count()).select_from(User))
    
    return {
        "developers": devs_count,
        "projects": projects_count,
        "users": users_count
    }

@admin_auth_router.get("/developers")
async def list_all_developers(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    from models.developer import Developer
    result = await db.execute(select(Developer).order_by(Developer.created_at.desc()))
    devs = result.scalars().all()
    # Return custom dict to hide password hashes
    return [{"id": d.id, "email": d.email, "is_active": d.is_active, "created_at": d.created_at} for d in devs]

@admin_auth_router.get("/projects", response_model=List[AdminProjectResponse])
async def list_all_projects(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    from sqlalchemy.orm import joinedload
    from sqlalchemy import func
    from models.project import Project
    from models.user import User
    
    result = await db.execute(
        select(Project).options(joinedload(Project.developer)).order_by(Project.created_at.desc())
    )
    projects = result.scalars().all()
    
    counts_result = await db.execute(select(User.project_id, func.count(User.id)).group_by(User.project_id))
    count_map = {row[0]: row[1] for row in counts_result.all()}
    
    for proj in projects:
        setattr(proj, 'users_count', count_map.get(proj.id, 0))
        
    return projects

@admin_auth_router.get("/projects/{project_id}/users", response_model=List[UserAdminResponse])
async def list_project_users(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(
        select(User).where(User.project_id == project_id).order_by(User.created_at.desc())
    )
    return result.scalars().all()

@admin_auth_router.get("/users", response_model=List[UserAdminResponse])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()

@admin_auth_router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}

@admin_auth_router.patch("/developers/{developer_id}/status")
async def update_developer_status(
    developer_id: int,
    status_update: dict,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    from models.developer import Developer
    result = await db.execute(select(Developer).where(Developer.id == developer_id))
    dev = result.scalars().first()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
        
    dev.is_active = status_update.get("is_active", True)
    await db.commit()
    await db.refresh(dev)
    return {"id": dev.id, "email": dev.email, "is_active": dev.is_active, "created_at": dev.created_at}

@admin_auth_router.delete("/developers/{developer_id}")
async def delete_developer(
    developer_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    from models.developer import Developer
    from models.project import Project
    result = await db.execute(select(Developer).where(Developer.id == developer_id))
    dev = result.scalars().first()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")
        
    # Delete associated projects and their users
    projects_result = await db.execute(select(Project).where(Project.developer_id == developer_id))
    projects = projects_result.scalars().all()
    for project in projects:
        await db.execute(User.__table__.delete().where(User.project_id == project.id))
        await db.delete(project)

    await db.delete(dev)
    await db.commit()
    return {"message": "Developer deleted successfully"}

@admin_auth_router.patch("/users/{user_id}/status", response_model=UserAdminResponse)
async def update_user_status(
    user_id: str,
    status_update: UserStatusUpdate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = status_update.is_active
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
            db, user.project_id, "user.suspended", user_data
        )
        
    return user

@admin_auth_router.patch("/password", response_model=AdminResponse)
async def update_admin_password(
    password_update: AdminPasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    if not verify_password(password_update.current_password, current_admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_admin.hashed_password = get_password_hash(password_update.new_password)
    await db.commit()
    await db.refresh(current_admin)
    return current_admin

@admin_auth_router.get("/settings", response_model=AdminResponse)
async def get_admin_settings(
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    return current_admin



@admin_auth_router.get("/config", response_model=SystemConfigPublic)
async def get_system_config(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "allow_public_registration"))
    config = result.scalars().first()
    allow = config.value == "true" if config else True
    return {"allow_public_registration": allow}

@admin_auth_router.patch("/config", response_model=SystemConfigPublic)
async def update_system_config(
    config_in: SystemConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "allow_public_registration"))
    config = result.scalars().first()
    
    val_str = "true" if config_in.allow_public_registration else "false"
    
    if config:
        config.value = val_str
    else:
        config = SystemConfig(key="allow_public_registration", value=val_str)
        db.add(config)
        
    await db.commit()
    return {"allow_public_registration": config_in.allow_public_registration}

router.include_router(admin_auth_router)


# --- Project Routes ---
project_router = APIRouter(prefix="/projects", tags=["projects"])

@project_router.post("", response_model=ProjectResponse)
async def create_project(
    project_in: ProjectCreate, 
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    api_key = f"pk_{secrets.token_urlsafe(32)}"
    new_project = Project(
        name=project_in.name,
        api_key=api_key
    )
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@project_router.get("", response_model=List[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(Project))
    return result.scalars().all()

@project_router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@project_router.get("/{project_id}/users", response_model=List[UserAdminResponse])
async def get_project_users(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(User).where(User.project_id == project_id))
    return result.scalars().all()

@project_router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
) -> Any:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete associated users first
    await db.execute(User.__table__.delete().where(User.project_id == project_id))
    
    # Delete the project
    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}

router.include_router(project_router)
