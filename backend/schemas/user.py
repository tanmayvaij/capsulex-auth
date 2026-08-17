from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    user_metadata: Optional[dict] = {}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str
    user_metadata: Optional[dict] = {}

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime | None = None
    last_signed_in: datetime | None = None
    user_metadata: Optional[dict] = {}
    
    # We will just expose the role names in the response
    roles: Optional[list] = []
    
    @field_validator('roles', mode='before')
    def extract_role_names(cls, v):
        if not v:
            return []
        # If it's a list of Role objects (ORM), extract names
        if len(v) > 0 and hasattr(v[0], 'name'):
            return [role.name for role in v]
        return v
    
    class Config:
        from_attributes = True

class UserMetadataUpdate(BaseModel):
    user_metadata: dict

class SendVerificationEmailRequest(BaseModel):
    email: EmailStr

class VerifyEmailRequest(BaseModel):
    token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserAdminResponse(UserResponse):
    project_id: int

class UserStatusUpdate(BaseModel):
    is_active: bool

class Token(BaseModel):
    access_token: str
    token_type: str
    refresh_token: str | None = None

class RefreshRequest(BaseModel):
    refresh_token: str
