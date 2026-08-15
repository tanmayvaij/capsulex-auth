import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from typing import Any, List

from db.session import get_db
from models.developer import Developer
from models.project import Project
from schemas.developer import DeveloperCreate, DeveloperLogin, DeveloperResponse, DeveloperPasswordUpdate
from schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from schemas.user import Token, RefreshRequest
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, ALGORITHM
from core.config import settings
from jose import jwt, JWTError
from api.deps import get_current_developer
from core.rate_limit import limiter

developer_router = APIRouter(prefix="/developer", tags=["developer"])

@developer_router.post("/auth/register", response_model=DeveloperResponse)
@limiter.limit("5/minute")
async def register_developer(
    request: Request,
    dev_in: DeveloperCreate, 
    db: AsyncSession = Depends(get_db)
) -> Any:
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
        
    result = await db.execute(
        select(User).where(User.project_id == project_id).order_by(User.created_at.desc())
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
    return user
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
    return None
