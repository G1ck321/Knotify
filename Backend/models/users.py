from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func

from models.base import Base


class User(Base):
    # ORM model for the users table.
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, unique=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
