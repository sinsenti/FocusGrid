from models import Base, TimeEntry
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os

DATABASE_URL = (
    f"postgresql://{os.environ.get('POSTGRES_USER', 'admin')}:"
    f"{os.environ.get('POSTGRES_PASSWORD', 'admin')}@db:5432/"
    f"{os.environ.get('POSTGRES_DB', 'timetracker')}"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()

samples = [
    TimeEntry(
        category="Study",
        minutes=60,
        description="Math revision",
        timestamp=datetime.now() - timedelta(days=1),
    ),
    TimeEntry(
        category="Relax",
        minutes=30,
        description="Meditation",
        timestamp=datetime.now(),
    ),
    TimeEntry(
        category="Code",
        minutes=90,
        description="React project",
        timestamp=datetime.now() - timedelta(days=2),
    ),
    TimeEntry(
        category="Study",
        minutes=45,
        description="Reading articles",
        timestamp=datetime.now(),
    ),
    TimeEntry(
        category="Sport",
        minutes=55,
        description="Jogging",
        timestamp=datetime.now() - timedelta(days=5),
    ),
]
db.bulk_save_objects(samples)
db.commit()
print("Sample data added.")
