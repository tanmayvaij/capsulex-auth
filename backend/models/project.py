from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from db.base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    developer_id = Column(Integer, ForeignKey("developers.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    api_key = Column(String, unique=True, index=True, nullable=False)
    allowed_origins = Column(JSON, default=list)
    mail_config = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="project", cascade="all, delete-orphan")
    developer = relationship("Developer", back_populates="projects")
