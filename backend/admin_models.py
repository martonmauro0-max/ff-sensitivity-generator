from sqlalchemy import Boolean, Column, Integer, String
from backend.database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="Admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(String(30))
    updated_at = Column(String(30))


class AdminLog(Base):
    __tablename__ = "admin_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False)
    description = Column(String(500), nullable=False)
    resource = Column(String(50), nullable=True)
    resource_id = Column(Integer, nullable=True)
    created_at = Column(String(30), nullable=False)
