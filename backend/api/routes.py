import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select, and_
from typing import Any, List
from datetime import datetime, timedelta, timezone

from db.session import get_db
from schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, UserAdminResponse, 
    UserStatusUpdate, VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest,
    SendVerificationEmailRequest
)
from schemas.project import ProjectCreate, ProjectResponse, AdminProjectResponse
from models.user import User
from models.project import Project
from models.admin import Admin
from schemas.admin import AdminLogin, AdminResponse, AdminPasswordUpdate, AdminSettingsUpdate, AdminSetup
from core.security import get_password_hash, verify_password, create_access_token
from core.config import settings
from api.deps import get_current_user, get_project_from_api_key, get_current_admin
from services.email import get_email_service, BaseEmailService

router = APIRouter()

# --- Auth Routes ---
auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate, 
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key)
) -> Any:
    hashed_password = get_password_hash(user_in.password)
    verification_token = secrets.token_urlsafe(32)
    
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        project_id=project.id,
        verification_token=verification_token
    )
    db.add(new_user)
    try:
        await db.commit()
        await db.refresh(new_user)
        
        return new_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists in this project."
        )

@auth_router.post("/login", response_model=Token)
async def login(
    user_in: UserLogin, 
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_from_api_key)
) -> Any:
    result = await db.execute(
        select(User).where(
            and_(User.email == user_in.email, User.project_id == project.id)
        )
    )
    user = result.scalars().first()
    
    if not user or not verify_password(user_in.password, user.hashed_password):
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
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

@auth_router.post("/send-verification-email")
async def send_verification_email(
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
async def verify_email(
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
async def forgot_password(
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
async def reset_password(
    req: ResetPasswordRequest,
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
    
    return {"message": "Password has been reset successfully"}

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
async def admin_login(
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
    return {"access_token": access_token, "token_type": "bearer"}

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
