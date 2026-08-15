from pydantic import BaseModel

class SystemConfigUpdate(BaseModel):
    allow_public_registration: bool

class SystemConfigPublic(BaseModel):
    allow_public_registration: bool
