from core.database import Base
from datetime import datetime
from sqlalchemy import Column, DateTime, Integer, String


class Plan_annotations(Base):
    __tablename__ = "plan_annotations"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, nullable=False)
    user_id = Column(String, nullable=False)
    annotation_id = Column(String, nullable=False)
    author_id = Column(String, nullable=True)
    author_name = Column(String, nullable=True)
    author_role = Column(String, nullable=True)
    avatar_color = Column(String, nullable=True)
    type = Column(String, nullable=True)
    target_section = Column(String, nullable=True)
    content = Column(String, nullable=False)
    ann_timestamp = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.now)
    updated_at = Column(DateTime(timezone=True), default=datetime.now, onupdate=datetime.now)