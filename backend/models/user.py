import string
import random
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base

def generate_user_id():
    chars = string.ascii_lowercase + string.digits
    random_str = ''.join(random.choice(chars) for _ in range(16))
    return f"ixca_{random_str}"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=generate_user_id)
    email = Column(String, index=True, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    hashed_password = Column(String, nullable=True)
    otp_code = Column(String, nullable=True)
    otp_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    is_email_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True, index=True)
    reset_password_token = Column(String, nullable=True, index=True)
    reset_password_expires_at = Column(DateTime(timezone=True), nullable=True)
    user_metadata = Column(JSON, default=dict, server_default='{}')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_signed_in = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project")
    sessions = relationship("models.session.Session", back_populates="user", cascade="all, delete-orphan")
    roles = relationship("models.rbac.Role", secondary="user_roles", back_populates="users")

    __table_args__ = (
        UniqueConstraint('email', 'project_id', name='uq_user_email_project'),
    )
