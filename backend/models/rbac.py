from sqlalchemy import Column, String, Integer, ForeignKey, Table, UniqueConstraint
from sqlalchemy.orm import relationship
from db.base import Base

# Association table for User-Role (Many-to-Many)
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', String(36), ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('role_id', String(36), ForeignKey('roles.id', ondelete="CASCADE"), primary_key=True)
)

# Association table for Role-Permission (Many-to-Many)
role_permissions = Table(
    'role_permissions',
    Base.metadata,
    Column('role_id', String(36), ForeignKey('roles.id', ondelete="CASCADE"), primary_key=True),
    Column('permission_id', String(36), ForeignKey('permissions.id', ondelete="CASCADE"), primary_key=True)
)

class Role(Base):
    __tablename__ = "roles"

    id = Column(String(36), primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(50), nullable=False) # e.g. "admin", "editor"
    description = Column(String(255), nullable=True)

    # A project cannot have two roles with the exact same name
    __table_args__ = (UniqueConstraint('project_id', 'name', name='_project_role_uc'),)

    project = relationship("Project", back_populates="roles")
    users = relationship("User", secondary=user_roles, back_populates="roles")
    permissions = relationship("Permission", secondary=role_permissions, back_populates="roles")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(String(36), primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False) # e.g. "post:write", "user:delete"

    # A project cannot have two permissions with the exact same action string
    __table_args__ = (UniqueConstraint('project_id', 'action', name='_project_permission_uc'),)

    project = relationship("Project")
    roles = relationship("Role", secondary=role_permissions, back_populates="permissions")
