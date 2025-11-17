from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class TimeEntry(Base):
    __tablename__ = "time_entry"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(64), nullable=False)
    description = Column(String(128))
    minutes = Column(Integer, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.now)
