from pydantic import BaseModel, EmailStr
from datetime import datetime

class DeveloperBase(BaseModel):
    email: EmailStr

class DeveloperCreate(DeveloperBase):
    password: str

class DeveloperLogin(DeveloperBase):
    password: str

class DeveloperResponse(DeveloperBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DeveloperPasswordUpdate(BaseModel):
    current_password: str
    new_password: str
