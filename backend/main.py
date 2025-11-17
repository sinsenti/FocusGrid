import os
from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, or_, func
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime, timedelta
from models import Base, TimeEntry

DATABASE_URL = (
    f"postgresql://{os.environ.get('POSTGRES_USER', 'admin')}:"
    f"{os.environ.get('POSTGRES_PASSWORD', 'admin')}@db:5432/"
    f"{os.environ.get('POSTGRES_DB', 'timetracker')}"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


class TimeEntryCreate(BaseModel):
    category: str
    minutes: int
    description: str = ""
    timestamp: str = ""


class TimeEntryUpdate(BaseModel):
    category: str = None
    minutes: int = None
    description: str = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/add")
def add_entry(entry: TimeEntryCreate, db: Session = Depends(get_db)):
    ts = datetime.fromisoformat(entry.timestamp) if entry.timestamp else datetime.now()
    db_entry = TimeEntry(
        category=entry.category,
        description=entry.description,
        minutes=entry.minutes,
        timestamp=ts,
    )
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return {"success": True}


@app.get("/api/entries")
def list_entries(db: Session = Depends(get_db)):
    entries = db.query(TimeEntry).all()
    return [
        {
            "id": e.id,
            "category": e.category,
            "description": e.description,
            "minutes": e.minutes,
            "timestamp": e.timestamp.isoformat(),
        }
        for e in entries
    ]


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    now = datetime.now()
    week_start = now - timedelta(days=now.weekday())
    month_start = now.replace(day=1)
    stats = {"week": {}, "month": {}}
    entries = db.query(TimeEntry).all()
    for e in entries:
        if e.timestamp >= week_start:
            stats["week"][e.category] = stats["week"].get(e.category, 0) + e.minutes
        if e.timestamp >= month_start:
            stats["month"][e.category] = stats["month"].get(e.category, 0) + e.minutes
    return stats


@app.put("/api/update/{entry_id}")
def update_entry(entry_id: int, update: TimeEntryUpdate, db: Session = Depends(get_db)):
    entry = db.query(TimeEntry).filter(TimeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if update.category is not None:
        entry.category = update.category
    if update.minutes is not None:
        entry.minutes = update.minutes
    if update.description is not None:
        entry.description = update.description
    db.commit()
    return {"success": True}


@app.get("/api/entries_filter")
def filter_entries(q: str = Query("", alias="q"), db: Session = Depends(get_db)):
    query = db.query(TimeEntry)
    if q:
        q_like = f"%{q.lower()}%"
        query = query.filter(
            or_(
                func.lower(TimeEntry.category).like(q_like),
                func.lower(TimeEntry.description).like(q_like),
            )
        )
    entries = query.all()
    return [
        {
            "id": e.id,
            "category": e.category,
            "description": e.description,
            "minutes": e.minutes,
            "timestamp": e.timestamp.isoformat(),
        }
        for e in entries
    ]


@app.post("/api/delete_all")
def delete_all(db: Session = Depends(get_db)):
    num_deleted = db.query(TimeEntry).delete()
    db.commit()
    return {"success": True, "deleted": num_deleted}
