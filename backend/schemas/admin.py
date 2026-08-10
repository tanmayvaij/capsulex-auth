from pydantic import BaseModel, EmailStr
from datetime import datetime

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminSetup(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: int
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AdminSettingsUpdate(BaseModel):
    pass

class AdminPasswordUpdate(BaseModel):
    current_password: str
    new_password: str
