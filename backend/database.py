import os
import uuid
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Float, Integer, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# ----------------- DB RESET LOGIC -----------------
# Reset SQLite DB on schema upgrade to prevent migration clashes during development
db_file = "./northstar.db"
if os.path.exists(db_file):
    try:
        os.remove(db_file)
        print("Database schema upgraded: Resetting northstar.db")
    except Exception as e:
        print(f"Error resetting database file: {e}")

# ----------------- SQLITE SETUP -----------------
engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SQLTask(Base):
    __tablename__ = "tasks"
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(String(50), nullable=True)
    difficulty = Column(String(20), default="Medium")
    category = Column(String(50), default="Personal")
    status = Column(String(20), default="Pending")
    
    # Gemini Enhancement Columns
    estimated_hours = Column(Float, default=1.0)
    priority = Column(String(20), default="Medium")
    suggested_start_date = Column(String(50), nullable=True)
    
    # AI Prioritization Columns (0-100)
    urgency = Column(Float, default=0.0)
    impact = Column(Float, default=0.0)
    effort = Column(Float, default=0.0)
    priority_score = Column(Float, default=0.0)
    reasoning = Column(Text, nullable=True)
    
    # Risk predictor Columns
    risk_level = Column(String(20), default="Low")
    risk_percentage = Column(Float, default=0.0)
    risk_reason = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    
    # Vision OCR Metadata
    confidence_score = Column(Float, default=1.0)
    extraction_summary = Column(Text, nullable=True)

class SQLAssignmentInsight(Base):
    __tablename__ = "assignment_insights"
    task_id = Column(String(50), primary_key=True, index=True)
    simple_summary = Column(Text, nullable=True)
    estimated_effort_hours = Column(Float, default=0.0)
    milestones = Column(Text, nullable=True) # JSON String representing milestones list

class SQLCalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(String(50), primary_key=True, index=True)
    summary = Column(String(250), nullable=False)
    start_time = Column(String(50), nullable=False) # ISO String or HH:MM
    end_time = Column(String(50), nullable=False)
    is_synced = Column(Boolean, default=True)

class SQLSchedule(Base):
    __tablename__ = "schedule"
    id = Column(String(50), primary_key=True, index=True)
    date = Column(String(20), nullable=False)
    start_time = Column(String(10), nullable=False)
    end_time = Column(String(10), nullable=False)
    task_id = Column(String(50), nullable=True)
    task_name = Column(String(100), nullable=False)
    type = Column(String(20), default="work") # work, class, meeting, sleep, break

class SQLChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(String(50), primary_key=True, index=True)
    role = Column(String(20), nullable=False) # user, model
    message = Column(Text, nullable=False)
    timestamp = Column(String(50), nullable=False)

# Ensure tables are created
Base.metadata.create_all(bind=engine)


# ----------------- FIREBASE SETUP -----------------
firestore_db = None
if settings.USE_FIREBASE:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore
        
        # Avoid double initialization
        if not firebase_admin._apps:
            if settings.FIREBASE_CREDENTIALS and os.path.exists(settings.FIREBASE_CREDENTIALS):
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)
                firebase_admin.initialize_app(cred)
            else:
                # Default initialize using application default credentials
                firebase_admin.initialize_app()
        firestore_db = firestore.client()
        print("Firebase Firestore initialized successfully!")
    except Exception as e:
        print(f"Error initializing Firebase: {e}. Falling back to SQLite.")
        firestore_db = None


# ----------------- UNIFIED DB INTERFACE -----------------

def get_db_mode() -> str:
    if settings.USE_FIREBASE and firestore_db is not None:
        return "Firestore"
    return "SQLite"

# TASK OPERATIONS
def get_all_tasks():
    if get_db_mode() == "Firestore":
        tasks_ref = firestore_db.collection("tasks")
        docs = tasks_ref.stream()
        return [doc.to_dict() for doc in docs]
    else:
        db = SessionLocal()
        try:
            tasks = db.query(SQLTask).all()
            return [t.__dict__ for t in tasks]
        finally:
            db.close()

def get_task_by_id(task_id: str):
    if get_db_mode() == "Firestore":
        doc_ref = firestore_db.collection("tasks").document(task_id)
        doc = doc_ref.get()
        return doc.to_dict() if doc.exists else None
    else:
        db = SessionLocal()
        try:
            task = db.query(SQLTask).filter(SQLTask.id == task_id).first()
            return task.__dict__ if task else None
        finally:
            db.close()

def save_task(task_data: dict):
    if "id" not in task_data or not task_data["id"]:
        task_data["id"] = str(uuid.uuid4())
    
    # Remove metadata helper field to avoid DB write failure
    clean_task_data = dict(task_data)
    clean_task_data.pop("_sa_instance_state", None)

    if get_db_mode() == "Firestore":
        doc_ref = firestore_db.collection("tasks").document(clean_task_data["id"])
        doc_ref.set(clean_task_data)
        return clean_task_data
    else:
        db = SessionLocal()
        try:
            db_task = db.query(SQLTask).filter(SQLTask.id == clean_task_data["id"]).first()
            if db_task:
                # Update
                for k, v in clean_task_data.items():
                    if hasattr(db_task, k):
                        setattr(db_task, k, v)
            else:
                # Insert
                clean_data = {k: v for k, v in clean_task_data.items() if hasattr(SQLTask, k)}
                db_task = SQLTask(**clean_data)
                db.add(db_task)
            db.commit()
            db.refresh(db_task)
            return db_task.__dict__
        finally:
            db.close()

def delete_task(task_id: str):
    if get_db_mode() == "Firestore":
        firestore_db.collection("tasks").document(task_id).delete()
        # Also clean up insights if Firestore active
        firestore_db.collection("assignment_insights").document(task_id).delete()
        return True
    else:
        db = SessionLocal()
        try:
            db_task = db.query(SQLTask).filter(SQLTask.id == task_id).first()
            if db_task:
                db.delete(db_task)
                # Cleanup insights
                db.query(SQLAssignmentInsight).filter(SQLAssignmentInsight.task_id == task_id).delete()
                db.commit()
                return True
            return False
        finally:
            db.close()


# ASSIGNMENT INSIGHTS OPERATIONS
def get_insights_by_task_id(task_id: str):
    if get_db_mode() == "Firestore":
        doc_ref = firestore_db.collection("assignment_insights").document(task_id)
        doc = doc_ref.get()
        return doc.to_dict() if doc.exists else None
    else:
        db = SessionLocal()
        try:
            insight = db.query(SQLAssignmentInsight).filter(SQLAssignmentInsight.task_id == task_id).first()
            return insight.__dict__ if insight else None
        finally:
            db.close()

def save_insights(insights_data: dict):
    if get_db_mode() == "Firestore":
        doc_ref = firestore_db.collection("assignment_insights").document(insights_data["task_id"])
        doc_ref.set(insights_data)
        return insights_data
    else:
        db = SessionLocal()
        try:
            db_insight = db.query(SQLAssignmentInsight).filter(SQLAssignmentInsight.task_id == insights_data["task_id"]).first()
            if db_insight:
                for k, v in insights_data.items():
                    if hasattr(db_insight, k):
                        setattr(db_insight, k, v)
            else:
                db_insight = SQLAssignmentInsight(
                    task_id=insights_data["task_id"],
                    simple_summary=insights_data.get("simple_summary", ""),
                    estimated_effort_hours=insights_data.get("estimated_effort_hours", 0.0),
                    milestones=insights_data.get("milestones", "[]")
                )
                db.add(db_insight)
            db.commit()
            db.refresh(db_insight)
            return db_insight.__dict__
        finally:
            db.close()


# CALENDAR EVENT OPERATIONS
def get_all_calendar_events():
    if get_db_mode() == "Firestore":
        events_ref = firestore_db.collection("calendar_events")
        docs = events_ref.stream()
        return [doc.to_dict() for doc in docs]
    else:
        db = SessionLocal()
        try:
            events = db.query(SQLCalendarEvent).all()
            return [e.__dict__ for e in events]
        finally:
            db.close()

def save_calendar_events(events: list):
    for event in events:
        if "id" not in event or not event["id"]:
            event["id"] = str(uuid.uuid4())
            
        if get_db_mode() == "Firestore":
            doc_ref = firestore_db.collection("calendar_events").document(event["id"])
            doc_ref.set(event)
        else:
            db = SessionLocal()
            try:
                db_event = db.query(SQLCalendarEvent).filter(SQLCalendarEvent.id == event["id"]).first()
                if db_event:
                    db_event.summary = event["summary"]
                    db_event.start_time = event["start_time"]
                    db_event.end_time = event["end_time"]
                    db_event.is_synced = event.get("is_synced", True)
                else:
                    db_event = SQLCalendarEvent(
                        id=event["id"],
                        summary=event["summary"],
                        start_time=event["start_time"],
                        end_time=event["end_time"],
                        is_synced=event.get("is_synced", True)
                    )
                    db.add(db_event)
                db.commit()
            finally:
                db.close()

def clear_all_calendar_events():
    if get_db_mode() == "Firestore":
        events_ref = firestore_db.collection("calendar_events")
        docs = events_ref.stream()
        batch = firestore_db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
    else:
        db = SessionLocal()
        try:
            db.query(SQLCalendarEvent).delete()
            db.commit()
        finally:
            db.close()


# SCHEDULE OPERATIONS
def get_schedule_by_date(date_str: str):
    if get_db_mode() == "Firestore":
        sched_ref = firestore_db.collection("schedule").where("date", "==", date_str)
        docs = sched_ref.stream()
        return [doc.to_dict() for doc in docs]
    else:
        db = SessionLocal()
        try:
            schedule = db.query(SQLSchedule).filter(SQLSchedule.date == date_str).all()
            return [s.__dict__ for s in schedule]
        finally:
            db.close()

def clear_schedule_by_date(date_str: str):
    if get_db_mode() == "Firestore":
        sched_ref = firestore_db.collection("schedule").where("date", "==", date_str)
        docs = sched_ref.stream()
        batch = firestore_db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
    else:
        db = SessionLocal()
        try:
            db.query(SQLSchedule).filter(SQLSchedule.date == date_str).delete()
            db.commit()
        finally:
            db.close()

def save_schedule_blocks(blocks: list):
    for block in blocks:
        if "id" not in block or not block["id"]:
            block["id"] = str(uuid.uuid4())
            
        if get_db_mode() == "Firestore":
            doc_ref = firestore_db.collection("schedule").document(block["id"])
            doc_ref.set(block)
        else:
            db = SessionLocal()
            try:
                db_block = SQLSchedule(
                    id=block["id"],
                    date=block["date"],
                    start_time=block["start_time"],
                    end_time=block["end_time"],
                    task_id=block.get("task_id"),
                    task_name=block["task_name"],
                    type=block.get("type", "work")
                )
                db.add(db_block)
                db.commit()
            finally:
                db.close()


# CHAT HISTORY OPERATIONS
def get_chat_history(limit: int = 50):
    if get_db_mode() == "Firestore":
        history_ref = firestore_db.collection("chat_history").order_by("timestamp", direction=firestore.Query.ASCENDING).limit(limit)
        docs = history_ref.stream()
        return [doc.to_dict() for doc in docs]
    else:
        db = SessionLocal()
        try:
            history = db.query(SQLChatHistory).order_by(SQLChatHistory.timestamp.asc()).limit(limit).all()
            return [h.__dict__ for h in history]
        finally:
            db.close()

def save_chat_message(role: str, message: str):
    msg_data = {
        "id": str(uuid.uuid4()),
        "role": role,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    if get_db_mode() == "Firestore":
        doc_ref = firestore_db.collection("chat_history").document(msg_data["id"])
        doc_ref.set(msg_data)
        return msg_data
    else:
        db = SessionLocal()
        try:
            db_msg = SQLChatHistory(**msg_data)
            db.add(db_msg)
            db.commit()
            return db_msg.__dict__
        finally:
            db.close()

def clear_chat_history():
    if get_db_mode() == "Firestore":
        history_ref = firestore_db.collection("chat_history")
        docs = history_ref.stream()
        batch = firestore_db.batch()
        for doc in docs:
            batch.delete(doc.reference)
        batch.commit()
    else:
        db = SessionLocal()
        try:
            db.query(SQLChatHistory).delete()
            db.commit()
        finally:
            db.close()
