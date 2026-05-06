from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Messages(Base):
    __tablename__ = "messages"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    msg_id = Column(String, nullable=False)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    author_id = Column(String, nullable=True)
    author_name = Column(String, nullable=True)
    author_role = Column(String, nullable=True)
    avatar_color = Column(String, nullable=True)
    mention = Column(String, nullable=True)
    msg_timestamp = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)