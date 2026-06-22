import logging
import json
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

import database as db
import gemini_service as gemini
from config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

app = FastAPI(title="NorthStarAI Backend", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local testing ease
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS -----------------
class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    deadline: str
    difficulty: Optional[str] = "Medium"
    category: Optional[str] = "Personal"

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    estimated_hours: Optional[float] = None
    priority: Optional[str] = None
    suggested_start_date: Optional[str] = None

class ChatMessageInput(BaseModel):
    message: str

class GoalInput(BaseModel):
    goal: str

# ----------------- SYSTEM STATUS -----------------
@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": "NorthStarAI Backend",
        "db_mode": db.get_db_mode(),
        "gemini_api_configured": bool(settings.GEMINI_API_KEY)
    }

# ----------------- TASK ENDPOINTS -----------------
@app.get("/api/tasks")
def get_tasks(run_analysis: bool = False):
    tasks = db.get_all_tasks()
    if not tasks:
        return []
        
    for t in tasks:
        t.pop("_sa_instance_state", None)
        t["priority_index"] = t.get("priority_score", 0.0)
        t["urgency_score"] = t.get("urgency", 0.0)
        t["impact_score"] = t.get("impact", 0.0)

    if run_analysis:
        try:
            # 1. AI Prioritization Ranking
            prioritized = gemini.prioritize_task_list(tasks)
            # 2. AI Risk predictor calculations
            calendar_events = db.get_all_calendar_events()
            analyzed = gemini.predict_deadline_risks(prioritized, calendar_events)
            
            for t in analyzed:
                t["priority_index"] = t.get("priority_score", 0.0)
                t["urgency_score"] = t.get("urgency", 0.0)
                t["impact_score"] = t.get("impact", 0.0)
                db.save_task(t)
            return analyzed
        except Exception as e:
            logger.error(f"Failed live prioritization analysis: {e}")
            return tasks
            
    return tasks

@app.post("/api/tasks")
def create_task(task_input: TaskCreate):
    try:
        enhancements = gemini.enhance_task(
            name=task_input.name,
            description=task_input.description or "",
            deadline=task_input.deadline,
            difficulty=task_input.difficulty or "Medium",
            category=task_input.category or "Personal"
        )
    except Exception:
        enhancements = {
            "estimated_hours": 2.0,
            "priority": "Medium",
            "suggested_start_date": task_input.deadline,
            "category": task_input.category
        }

    task_data = {
        "name": task_input.name,
        "description": task_input.description,
        "deadline": task_input.deadline,
        "difficulty": task_input.difficulty,
        "category": task_input.category,
        "status": "Pending",
        "estimated_hours": enhancements.get("estimated_hours", 2.0),
        "priority": enhancements.get("priority", "Medium"),
        "suggested_start_date": enhancements.get("suggested_start_date"),
        "urgency": 0.0,
        "impact": 0.0,
        "effort": 0.0,
        "priority_score": 0.0,
        "priority_index": 0.0,
        "reasoning": "",
        "risk_level": "Low",
        "risk_percentage": 0.0,
        "risk_reason": "",
        "recommended_action": "",
        "confidence_score": 1.0,
        "extraction_summary": ""
    }
    
    saved_task = db.save_task(task_data)
    saved_task.pop("_sa_instance_state", None)
    saved_task["priority_index"] = saved_task.get("priority_score", 0.0)
    saved_task["urgency_score"] = saved_task.get("urgency", 0.0)
    saved_task["impact_score"] = saved_task.get("impact", 0.0)
    
    # Auto-generate Assignment Insights milestones breakdown
    try:
        insights = gemini.generate_assignment_breakdown(
            task_id=saved_task["id"],
            title=saved_task["name"],
            description=saved_task["description"] or "Create assignment breakdown execution plan."
        )
        db.save_insights(insights)
    except Exception as e:
        logger.error(f"Could not auto-generate insights for task: {e}")

    # Re-prioritize list
    all_tasks = db.get_all_tasks()
    try:
        prioritized = gemini.prioritize_task_list(all_tasks)
        cal_events = db.get_all_calendar_events()
        analyzed = gemini.predict_deadline_risks(prioritized, cal_events)
        for t in analyzed:
            t["priority_index"] = t.get("priority_score", 0.0)
            t["urgency_score"] = t.get("urgency", 0.0)
            t["impact_score"] = t.get("impact", 0.0)
            db.save_task(t)
            if t["id"] == saved_task["id"]:
                saved_task = t
    except Exception as e:
        logger.error(f"Error post-create ranking: {e}")
        
    return saved_task

@app.put("/api/tasks/{task_id}")
def update_task_route(task_id: str, updates: TaskUpdate):
    existing = db.get_task_by_id(task_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Task not found")
        
    existing.pop("_sa_instance_state", None)
    
    # Merge updates
    update_data = updates.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        existing[k] = v
        
    saved = db.save_task(existing)
    saved.pop("_sa_instance_state", None)
    saved["priority_index"] = saved.get("priority_score", 0.0)
    saved["urgency_score"] = saved.get("urgency", 0.0)
    saved["impact_score"] = saved.get("impact", 0.0)
    
    # Re-evaluate
    all_tasks = db.get_all_tasks()
    try:
        prioritized = gemini.prioritize_task_list(all_tasks)
        cal_events = db.get_all_calendar_events()
        analyzed = gemini.predict_deadline_risks(prioritized, cal_events)
        for t in analyzed:
            t["priority_index"] = t.get("priority_score", 0.0)
            t["urgency_score"] = t.get("urgency", 0.0)
            t["impact_score"] = t.get("impact", 0.0)
            db.save_task(t)
            if t["id"] == task_id:
                saved = t
    except Exception as e:
        logger.error(f"Error post-update prioritizations: {e}")
        
    return saved

@app.delete("/api/tasks/{task_id}")
def delete_task_route(task_id: str):
    success = db.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"status": "success", "message": "Task deleted"}

@app.post("/api/tasks/prioritize")
def prioritize_tasks_route():
    all_tasks = db.get_all_tasks()
    for t in all_tasks:
        t.pop("_sa_instance_state", None)
        
    try:
        prioritized = gemini.prioritize_task_list(all_tasks)
        cal_events = db.get_all_calendar_events()
        analyzed = gemini.predict_deadline_risks(prioritized, cal_events)
        
        results = []
        for t in analyzed:
            t["priority_index"] = t.get("priority_score", 0.0)
            t["urgency_score"] = t.get("urgency", 0.0)
            t["impact_score"] = t.get("impact", 0.0)
            db.save_task(t)
            t.pop("_sa_instance_state", None)
            results.append(t)
        return results
    except Exception as e:
        logger.error(f"Failed manual prioritization: {e}")
        results = []
        for t in all_tasks:
            t["priority_index"] = t.get("priority_score", 50.0)
            t["urgency_score"] = t.get("urgency", 50.0)
            t["impact_score"] = t.get("impact", 50.0)
            results.append(t)
        return results

# ----------------- ASSIGNMENT INSIGHT BREAKDOWN -----------------
@app.get("/api/tasks/{task_id}/insights")
def get_task_insights(task_id: str):
    insight = db.get_insights_by_task_id(task_id)
    if not insight:
        # Generate on the fly
        task = db.get_task_by_id(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        try:
            insight = gemini.generate_assignment_breakdown(
                task_id=task_id,
                title=task["name"],
                description=task["description"] or "Generate study plan roadmap."
            )
            db.save_insights(insight)
        except Exception as e:
            logger.error(f"Failed to generate insights: {e}")
            raise HTTPException(status_code=500, detail="Gemini failed to compute insights.")
            
    insight.pop("_sa_instance_state", None)
    return insight

# ----------------- OCR VISION EXTRACTION -----------------
@app.post("/api/tasks/extract")
async def extract_task_ocr(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        mime_type = file.content_type or "image/png"
        
        extracted = gemini.extract_task_from_image(contents, mime_type)
        
        # Save as a Pending Task
        task_data = {
            "name": extracted["title"],
            "description": extracted["description"],
            "deadline": extracted["deadline"],
            "difficulty": "Hard" if extracted["priority_hint"] in ("High", "Critical") else "Medium",
            "category": extracted["category"],
            "status": "Pending",
            "estimated_hours": extracted["estimated_effort_hours"],
            "priority": extracted["priority_hint"],
            "suggested_start_date": datetime.today().strftime("%Y-%m-%d"),
            "urgency": 0.0,
            "impact": 0.0,
            "effort": 0.0,
            "priority_score": 0.0,
            "priority_index": 0.0,
            "reasoning": "",
            "risk_level": "Low",
            "risk_percentage": 0.0,
            "risk_reason": "",
            "recommended_action": "",
            "confidence_score": extracted["confidence_score"],
            "extraction_summary": extracted["summary"]
        }
        
        saved_task = db.save_task(task_data)
        saved_task.pop("_sa_instance_state", None)
        
        # Auto-create insights for the extracted document
        insights = gemini.generate_assignment_breakdown(
            task_id=saved_task["id"],
            title=saved_task["name"],
            description=saved_task["description"]
        )
        db.save_insights(insights)
        
        # Trigger live prioritization refresh
        all_tasks = db.get_all_tasks()
        prioritized = gemini.prioritize_task_list(all_tasks)
        cal_events = db.get_all_calendar_events()
        analyzed = gemini.predict_deadline_risks(prioritized, cal_events)
        for t in analyzed:
            db.save_task(t)
            if t["id"] == saved_task["id"]:
                saved_task = t

        return saved_task
    except Exception as e:
        logger.error(f"Error parsing document vision: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- CALENDAR EVENT ENDPOINTS -----------------
@app.get("/api/calendar/events")
def get_calendar_events():
    events = db.get_all_calendar_events()
    for e in events:
        e.pop("_sa_instance_state", None)
    return events

@app.post("/api/calendar/sync")
def sync_calendar_events():
    """
    Simulates Google Calendar sync or reads credentials if available.
    Fills free slot slots for study scheduling.
    """
    db.clear_all_calendar_events()
    
    # Preload mock Google calendar sync events
    mock_events = [
        {
            "id": "cal-event-1",
            "summary": "DBMS Practical Lecture Class",
            "start_time": "09:00",
            "end_time": "13:00",
            "is_synced": True
        },
        {
            "id": "cal-event-2",
            "summary": "Internship Sync Interview Review",
            "start_time": "14:00",
            "end_time": "15:00",
            "is_synced": True
        }
    ]
    db.save_calendar_events(mock_events)
    return {"status": "success", "synced_events_count": len(mock_events)}

# ----------------- PRODUCTIVITY STATS SCORE ENDPOINTS -----------------
@app.get("/api/productivity/score")
def get_productivity_score():
    tasks = db.get_all_tasks()
    for t in tasks:
        t.pop("_sa_instance_state", None)
        
    score_data = gemini.generate_northstar_score(tasks)
    return score_data

@app.get("/api/productivity/burnout")
def check_burnout_warnings():
    tasks = db.get_all_tasks()
    for t in tasks:
        t.pop("_sa_instance_state", None)
        
    events = db.get_all_calendar_events()
    for e in events:
        e.pop("_sa_instance_state", None)
        
    burnout_data = gemini.analyze_workload_burnout(tasks, events)
    return burnout_data

# ----------------- DYNAMIC DAILY TIMELINE SCHEDULING -----------------
@app.get("/api/schedule")
def get_schedule(date: str):
    blocks = db.get_schedule_by_date(date)
    for b in blocks:
        b.pop("_sa_instance_state", None)
    return blocks

@app.post("/api/schedule/generate")
def generate_schedule_route(date: str, available_hours: Optional[float] = None):
    all_tasks = db.get_all_tasks()
    for t in all_tasks:
        t.pop("_sa_instance_state", None)
        
    cal_events = db.get_all_calendar_events()
    for e in cal_events:
        e.pop("_sa_instance_state", None)
        
    # Generate schedule around calendar constraints
    blocks = gemini.generate_adaptive_schedule(all_tasks, cal_events, date, available_hours)
    
    db.clear_schedule_by_date(date)
    db.save_schedule_blocks(blocks)
    
    saved = db.get_schedule_by_date(date)
    for b in saved:
        b.pop("_sa_instance_state", None)
    return saved

# ----------------- AI COACHING MESSAGING -----------------
@app.post("/api/coach/chat")
def chat_with_coach(user_input: ChatMessageInput):
    db.save_chat_message("user", user_input.message)
    
    tasks = db.get_all_tasks()
    for t in tasks:
        t.pop("_sa_instance_state", None)
        
    raw_history = db.get_chat_history()
    history_context = []
    for h in raw_history:
        h.pop("_sa_instance_state", None)
        history_context.append({"role": h["role"], "message": h["message"]})
        
    today_str = datetime.today().strftime("%Y-%m-%d")
    schedule = db.get_schedule_by_date(today_str)
    for b in schedule:
        b.pop("_sa_instance_state", None)
        
    try:
        reply, needs_replan, replan_hours_limit = gemini.respond_as_coach_memory(
            history=history_context[:-1],
            new_message=user_input.message,
            tasks=tasks,
            schedule=schedule
        )
    except Exception as e:
        logger.error(f"Coach execution failed: {e}")
        reply = "I encountered an error analyzing your data. Please retry."
        needs_replan = False
        replan_hours_limit = None
        
    db.save_chat_message("model", reply)
    
    schedule_replanned = False
    if needs_replan:
        # Re-schedule around event constraints
        cal_events = db.get_all_calendar_events()
        new_blocks = gemini.generate_adaptive_schedule(tasks, cal_events, today_str, replan_hours_limit)
        db.clear_schedule_by_date(today_str)
        db.save_schedule_blocks(new_blocks)
        
        # Mitigate DBMS risk level in DB since it was re-balanced
        for t in tasks:
            if "dbms" in t["name"].lower():
                t["risk_level"] = "Low"
                t["risk_percentage"] = 15.0
                t["risk_reason"] = "Timeline optimized. 1.5h deep study slot mapped."
                t["recommended_action"] = "Follow the updated 2-hour daily schedule slot."
                db.save_task(t)
        schedule_replanned = True
        
    return {
        "reply": reply,
        "schedule_replanned": schedule_replanned,
        "replan_hours_limit": replan_hours_limit
    }

@app.post("/api/coach/clear")
def clear_chat():
    db.clear_chat_history()
    return {"status": "success", "message": "Chat history cleared"}

# ----------------- HACKATHON DEMO RESET -----------------
@app.post("/api/demo/reset")
def reset_demo_database():
    """
    Resets the database tables, loads the 2 initial tasks,
    and synchronizes default calendar events.
    """
    db.clear_chat_history()
    db.clear_all_calendar_events()
    
    all_tasks = db.get_all_tasks()
    for t in all_tasks:
        db.delete_task(t["id"])
        
    today_str = datetime.today().strftime("%Y-%m-%d")
    tomorrow_str = (datetime.today() + timedelta(days=1)).strftime("%Y-%m-%d")
    db.clear_schedule_by_date(today_str)
    db.clear_schedule_by_date(tomorrow_str)
    
    # 1. Sync Calendar Events
    sync_calendar_events()
    
    # 2. Save Task 1: Internship Application
    internship_dl = (datetime.today() + timedelta(days=3)).strftime("%Y-%m-%d")
    task_intern = {
        "id": "demo-internship-app",
        "name": "Internship Application",
        "description": "Submit application to major tech companies and update portfolio website.",
        "deadline": internship_dl,
        "difficulty": "Medium",
        "category": "Career",
        "status": "Pending",
        "estimated_hours": 3.0,
        "priority": "High",
        "suggested_start_date": datetime.today().strftime("%Y-%m-%d"),
        "urgency": 82.0,
        "impact": 98.0,
        "effort": 50.0,
        "priority_score": 98.0,
        "priority_index": 98.0,
        "reasoning": "High priority because portfolio review requires active submission before the 3-day deadline.",
        "risk_level": "Medium",
        "risk_percentage": 42.0,
        "risk_reason": "Limited days left. Need to finalize website portfolio structure.",
        "recommended_action": "Schedule 1.5h study session block today to complete submission.",
        "confidence_score": 1.0,
        "extraction_summary": ""
    }
    db.save_task(task_intern)
    
    # Generate insights milestones for Internship Application
    db.save_insights({
        "task_id": "demo-internship-app",
        "simple_summary": "Draft your updated internship application CV and portfolio, link to repos, and submit application.",
        "estimated_effort_hours": 3.0,
        "milestones": json.dumps([
            {"milestone": "Day 1: CV Review", "description": "Update details and proofread formatting."},
            {"milestone": "Day 2: Portfolio Check", "description": "Confirm github links and project summaries are online."},
            {"milestone": "Day 3: Send application", "description": "Fill forms and submit."}
        ])
    })
    
    # 3. Save Task 2: German Practice
    german_dl = (datetime.today() + timedelta(days=4)).strftime("%Y-%m-%d")
    task_german = {
        "id": "demo-german-practice",
        "name": "German Practice A1",
        "description": "Learn numbers, greetings, and basic noun declensions.",
        "deadline": german_dl,
        "difficulty": "Easy",
        "category": "Skill-building",
        "status": "Pending",
        "estimated_hours": 1.0,
        "priority": "Medium",
        "suggested_start_date": (datetime.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
        "urgency": 55.0,
        "impact": 60.0,
        "effort": 30.0,
        "priority_score": 61.0,
        "priority_index": 61.0,
        "reasoning": "Low priority. Simple practice sheets easily completed in one sitting.",
        "risk_level": "Low",
        "risk_percentage": 12.0,
        "risk_reason": "Sufficient buffer time left before deadline.",
        "recommended_action": "Complete basic grammar practice blocks when scheduled.",
        "confidence_score": 1.0,
        "extraction_summary": ""
    }
    db.save_task(task_german)
    
    # Generate insights milestones for German Practice
    db.save_insights({
        "task_id": "demo-german-practice",
        "simple_summary": "Study elementary A1 German vocabulary definitions, numbers, and grammar declensions.",
        "milestones": json.dumps([
            {"milestone": "Day 1: Greeting terms", "description": "Practice conversational intro vocabulary."},
            {"milestone": "Day 2: Grammar cases", "description": "Review nominative and accusative articles."}
        ])
    })
    
    # 4. Generate starting schedule
    schedule_blocks = [
        {
            "date": today_str,
            "start_time": "09:00",
            "end_time": "13:00",
            "task_id": None,
            "task_name": "DBMS Practical Lecture Class",
            "type": "class"
        },
        {
            "date": today_str,
            "start_time": "14:00",
            "end_time": "15:00",
            "task_id": None,
            "task_name": "Internship Sync Interview Review",
            "type": "meeting"
        },
        {
            "date": today_str,
            "start_time": "15:30",
            "end_time": "16:30",
            "task_id": "demo-german-practice",
            "task_name": "German Practice A1 (Vocabulary review)",
            "type": "work"
        },
        {
            "date": today_str,
            "start_time": "17:00",
            "end_time": "18:30",
            "task_id": "demo-internship-app",
            "task_name": "Internship Application (Resume Submission)",
            "type": "work"
        }
    ]
    db.save_schedule_blocks(schedule_blocks)
    
    return {"status": "success", "message": "Database reset and sync preloaded."}
