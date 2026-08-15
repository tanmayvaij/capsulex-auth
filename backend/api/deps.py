from fastapi import Depends, HTTPException, status, Header, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.config import settings
from core.security import ALGORITHM
from db.session import get_db
from models.user import User
from models.project import Project
from models.admin import Admin

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_project_from_api_key(
    request: Request,
    x_api_key: str = Header(...), 
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Project).where(Project.api_key == x_api_key))
    project = result.scalars().first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
        
    origin = request.headers.get("origin")
    if not origin:
        origin = request.headers.get("referer")
        if origin:
            from urllib.parse import urlparse
            parsed = urlparse(origin)
            origin = f"{parsed.scheme}://{parsed.netloc}"
            
    if origin:
        allowed = project.allowed_origins or []
        origin_cleaned = origin.rstrip("/")
        allowed_cleaned = [o.rstrip("/") for o in allowed]
        
        if origin_cleaned not in allowed_cleaned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requests from this origin ({origin_cleaned}) are not permitted by the project settings.",
            )
            
    return project

async def get_current_user(request: Request, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try getting token from cookie first, fallback to header
    actual_token = request.cookies.get("access_token") or token
    if not actual_token:
        raise credentials_exception

    try:
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account suspended"
        )
        
    return user
async def get_current_admin(request: Request, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate admin credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    actual_token = request.cookies.get("admin_token") or token
    if not actual_token:
        raise credentials_exception

    try:
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        admin_id_str: str = payload.get("sub")
        role: str = payload.get("role")
        if admin_id_str is None or role != "admin":
            raise credentials_exception
        admin_id = int(admin_id_str)
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    admin = result.scalars().first()
    
    if admin is None:
        raise credentials_exception
    return admin

async def get_current_developer(request: Request, token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    from models.developer import Developer
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate developer credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    actual_token = request.cookies.get("developer_token") or token
    if not actual_token:
        raise credentials_exception

    try:
        payload = jwt.decode(actual_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        dev_id_str: str = payload.get("sub")
        role: str = payload.get("role")
        if dev_id_str is None or role != "developer":
            raise credentials_exception
        dev_id = int(dev_id_str)
    except JWTError:
        raise credentials_exception
        
    result = await db.execute(select(Developer).where(Developer.id == dev_id))
    developer = result.scalars().first()
    
    if developer is None:
        raise credentials_exception
        
    return developer
