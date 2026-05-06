from core.database import Base
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Integer, String


class App_sessions(Base):
    __tablename__ = "app_sessions"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    phase = Column(String, nullable=True)
    plan_markdown = Column(String, nullable=True)
    build_complete = Column(Boolean, nullable=True)
    collaborators_json = Column(String, nullable=True)
    modules_json = Column(String, nullable=True)
    comments_json = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)