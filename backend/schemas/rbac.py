from pydantic import BaseModel, Field
from typing import List, Optional

class PermissionBase(BaseModel):
    action: str

class PermissionCreate(PermissionBase):
    pass

class PermissionResponse(PermissionBase):
    id: str
    project_id: int

    class Config:
        from_attributes = True

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    permissions: List[str] = [] # List of action strings

class RoleUpdate(RoleBase):
    permissions: Optional[List[str]] = None

class RoleResponse(RoleBase):
    id: str
    project_id: int
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True

# Helper schema for assigning roles to a user
class UserRoleUpdate(BaseModel):
    roles: List[str] # List of role names or role IDs
