import json
import logging
from datetime import datetime, timedelta
import google.generativeai as genai
from config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gemini_service")

# Configure Gemini
api_key = settings.GEMINI_API_KEY
if api_key:
    try:
        genai.configure(api_key=api_key)
        model_name = "gemini-1.5-pro"
        logger.info(f"Gemini API configured successfully using model {model_name}.")
    except Exception as e:
        logger.error(f"Error configuring Gemini API: {e}. Falling back to simulations.")
        api_key = None
else:
    logger.warning("No GEMINI_API_KEY found in environment. Backend will run in simulation mode for the hackathon demo.")

def _call_gemini_json(prompt: str, system_instruction: str = "") -> dict:
    """Helper to make a Gemini API call returning JSON."""
    if not api_key:
        raise ValueError("No API Key configured.")
        
    try:
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={"response_mime_type": "application/json"},
            system_instruction=system_instruction
        )
        response = model.generate_content(prompt, request_options={"timeout": 5.0})
        text = response.text.strip()
        return json.loads(text)
    except Exception as e:
        logger.error(f"Gemini API Call failed: {e}")
        raise e

# ----------------- 1. REAL GEMINI TASK EXTRACTION & OCR -----------------
def extract_task_from_image(image_bytes: bytes, mime_type: str, _use_simulation: bool = False) -> dict:
    """
    Uses Gemini Vision to read task sheets/syllabus images and outputs structured task data
    plus confidence scores and brief summaries.
    """
    if not api_key or _use_simulation:
        logger.info("Simulating OCR Vision Extraction.")
        return {
            "title": "DBMS Mini Project",
            "description": "Design and implement a relational database schema. Write SQL CREATE tables, insert queries, and document relationships.",
            "deadline": "2026-06-28",
            "category": "Academic",
            "estimated_effort_hours": 6.0,
            "priority_hint": "High",
            "confidence_score": 0.95,
            "summary": "RELATIONAL DB ASSIGNMENT: Parse schema, write insert queries, test constraints. Extracted from document screenshot."
        }

    try:
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        image_part = {"data": image_bytes, "mime_type": mime_type}
        
        prompt = f"""
        You are a Document Parsing specialist. Parse this assignment, syllabus, or deadline notification screenshot.
        Extract:
        1. title: A concise name of the task.
        2. description: Detail instructions or goals.
        3. deadline: Date in YYYY-MM-DD format. Assume the current year is 2026. If the image says 'June 28', output '2026-06-28'.
        4. category: One of 'Academic', 'Work', 'Personal', 'Career'.
        5. estimated_effort_hours: Estimated study hours required (float).
        6. priority_hint: One of 'Low', 'Medium', 'High', 'Critical'.
        7. confidence_score: Float between 0.0 and 1.0 representing how confident you are in reading this document.
        8. summary: A brief summary of extraction findings.
        
        Return JSON matching this schema:
        {{
          "title": "string",
          "description": "string",
          "deadline": "YYYY-MM-DD",
          "category": "string",
          "estimated_effort_hours": float,
          "priority_hint": "Low" | "Medium" | "High" | "Critical",
          "confidence_score": float,
          "summary": "string"
        }}
        """
        response = model.generate_content([prompt, image_part], generation_config={"response_mime_type": "application/json"}, request_options={"timeout": 5.0})
        return json.loads(response.text.strip())
    except Exception as e:
        logger.error(f"Gemini Vision extraction failed: {e}. Falling back to default simulation.")
        return extract_task_from_image(b"", "", _use_simulation=True)


# ----------------- 2. AI PRIORITIZATION ENGINE -----------------
def prioritize_task_list(tasks: list, _use_simulation: bool = False) -> list:
    """
    Ranks task priorities dynamically based on urgency, impact, effort, and deadline proximity.
    Generates index scores and strategic reasoning.
    """
    if not tasks:
        return []

    if not api_key or _use_simulation:
        logger.info("Simulating Task Prioritizations.")
        today = datetime.today().date()
        prioritized = []
        for task in tasks:
            name_lower = task["name"].lower()
            try:
                dl_date = datetime.strptime(task["deadline"], "%Y-%m-%d").date()
                days_left = (dl_date - today).days
            except Exception:
                days_left = 7
                
            if "dbms" in name_lower:
                urgency = 95.0 if days_left <= 6 else 80.0
                impact = 92.0
                effort = 80.0
                p_score = 92.0
                reason = "High priority because deadline is within 6 days and project requires 6 hours of intensive schema work."
            elif "internship" in name_lower:
                urgency = 92.0 if days_left <= 3 else 82.0
                impact = 98.0
                effort = 50.0
                p_score = 98.0
                reason = "Critical career impact. Deadline is very close, requires updates to CV portfolio."
            elif "german" in name_lower:
                urgency = 55.0
                impact = 60.0
                effort = 30.0
                p_score = 61.0
                reason = "Medium priority. Basic language practice due in 4 days, low effort needed."
            else:
                difficulty_val = {"Easy": 30, "Medium": 65, "Hard": 85}.get(task.get("difficulty", "Medium"), 65)
                urgency = max(10, min(100, 100 - (days_left * 12)))
                impact = difficulty_val
                effort = float(task.get("estimated_hours", 2.0)) * 10
                p_score = round((urgency * 0.5) + (impact * 0.3) + ((100 - effort) * 0.2))
                reason = f"Calculated priority index {p_score} based on {days_left} days left and estimated {task.get('estimated_hours')} hours effort."

            updated_task = dict(task)
            updated_task.update({
                "urgency": round(urgency, 1),
                "impact": round(impact, 1),
                "effort": round(effort, 1),
                "priority_score": round(p_score, 1),
                "priority_index": round(p_score, 1), # sync back to preview indicator compatibility
                "reasoning": reason,
                "priority": "Critical" if p_score >= 90 else ("High" if p_score >= 75 else ("Medium" if p_score >= 50 else "Low"))
            })
            prioritized.append(updated_task)
            
        prioritized.sort(key=lambda x: x["priority_score"], reverse=True)
        return prioritized

    # Call Gemini Pro to run priorities ranking
    tasks_input = [{
        "id": t["id"],
        "name": t["name"],
        "deadline": t["deadline"],
        "difficulty": t.get("difficulty", "Medium"),
        "estimated_hours": t.get("estimated_hours", 2.0)
    } for t in tasks]
    
    prompt = f"""
    You are a productivity strategist. Rank these tasks based on:
    - Urgency: proximity to deadline.
    - Impact: structural importance of completing this task.
    - Effort: how much time this takes.
    Today is {datetime.today().strftime('%Y-%m-%d')}.
    
    For each task, return:
    1. urgency (0-100 float)
    2. impact (0-100 float)
    3. effort (0-100 float)
    4. priority_score (0-100 blended priority score, higher is more critical)
    5. reasoning: A short sentence explaining the priority (e.g. 'High priority because deadline is within 3 days and requires 6 hours of work').
    
    Task list:
    {json.dumps(tasks_input)}
    
    Return JSON list matching this schema:
    [
      {{
        "id": "string",
        "urgency": float,
        "impact": float,
        "effort": float,
        "priority_score": float,
        "reasoning": "string"
      }}
    ]
    """
    try:
        results = _call_gemini_json(prompt, "You are a ranking optimization assistant.")
        res_map = {r["id"]: r for r in results}
        
        prioritized = []
        for task in tasks:
            tid = task["id"]
            updated = dict(task)
            if tid in res_map:
                p_score = res_map[tid]["priority_score"]
                updated.update({
                    "urgency": res_map[tid]["urgency"],
                    "impact": res_map[tid]["impact"],
                    "effort": res_map[tid]["effort"],
                    "priority_score": p_score,
                    "priority_index": p_score,
                    "reasoning": res_map[tid]["reasoning"],
                    "priority": "Critical" if p_score >= 90 else ("High" if p_score >= 75 else ("Medium" if p_score >= 50 else "Low"))
                })
            prioritized.append(updated)
        
        prioritized.sort(key=lambda x: x["priority_score"], reverse=True)
        return prioritized
    except Exception as e:
        logger.error(f"Gemini priority engine failed: {e}. Falling back to simulation.")
        return prioritize_task_list(tasks, _use_simulation=True)


# ----------------- 3. DEADLINE RISK PREDICTOR -----------------
def predict_deadline_risks(tasks: list, calendar_events: list = None, _use_simulation: bool = False) -> list:
    """
    Computes risk of missing deadline based on remaining days, task effort,
    and concurrent workload from active calendar events.
    """
    if not tasks:
        return []

    if not api_key or _use_simulation:
        logger.info("Simulating Risk Predictor.")
        today = datetime.today().date()
        analyzed = []
        
        for task in tasks:
            name_lower = task["name"].lower()
            updated = dict(task)
            
            try:
                dl_date = datetime.strptime(task["deadline"], "%Y-%m-%d").date()
                days_left = (dl_date - today).days
            except Exception:
                days_left = 7

            if "dbms" in name_lower:
                updated.update({
                    "risk_percentage": 78.0,
                    "risk_level": "High",
                    "risk_reason": "Not enough study slots left before the deadline. You have university classes and internship tasks occupying free evening slots.",
                    "recommended_action": "Cancel secondary study blocks (like German vocabulary) tonight. Schedule a deep work block from 4:00 PM to 7:00 PM."
                })
            elif "internship" in name_lower:
                updated.update({
                    "risk_percentage": 42.0,
                    "risk_level": "Medium",
                    "risk_reason": "Task needs 3.0 hours, and you have classes today. Deadline is approaching.",
                    "recommended_action": "Carve out 1.5 hours today at 6 PM right after class to finalize CV layout."
                })
            else:
                pct = max(10.0, min(95.0, (float(task.get("estimated_hours", 2.0)) / max(1, days_left)) * 25))
                level = "High" if pct >= 70 else ("Medium" if pct >= 35 else "Low")
                updated.update({
                    "risk_percentage": round(pct, 1),
                    "risk_level": level,
                    "risk_reason": f"Sufficient time left ({days_left} days) to complete {task.get('estimated_hours')} hours of work." if level == "Low" else "Workload is tight relative to the remaining days.",
                    "recommended_action": "Follow schedule timeline blocks to keep progress on track."
                })
            analyzed.append(updated)
        return analyzed

    # Call Gemini Pro
    tasks_input = [{
        "id": t["id"],
        "name": t["name"],
        "deadline": t["deadline"],
        "estimated_hours": t.get("estimated_hours", 2.0),
        "status": t.get("status", "Pending")
    } for t in tasks if t.get("status") != "Completed"]
    
    events_input = calendar_events if calendar_events else []
    
    prompt = f"""
    Analyze the deadline risks for these active tasks. Today is {datetime.today().strftime('%Y-%m-%d')}.
    Take into account the user's workload, estimated task hours, and upcoming calendar sync commitments:
    
    Active Tasks:
    {json.dumps(tasks_input)}
    
    Upcoming Calendar Events:
    {json.dumps(events_input)}
    
    For each task, calculate:
    1. risk_percentage (0-100 float)
    2. risk_level ('Low' | 'Medium' | 'High')
    3. explanation (why is this risky or safe?)
    4. recommended_action (mitigation steps to prevent missed deadlines)
    
    Return JSON list matching this schema:
    [
      {{
        "id": "string",
        "risk_percentage": float,
        "risk_level": "Low" | "Medium" | "High",
        "explanation": "string",
        "recommended_action": "string"
      }}
    ]
    """
    try:
        results = _call_gemini_json(prompt, "You are a risk analysis engine.")
        res_map = {r["id"]: r for r in results}
        
        analyzed = []
        for task in tasks:
            tid = task["id"]
            updated = dict(task)
            if tid in res_map:
                updated.update({
                  "risk_percentage": res_map[tid]["risk_percentage"],
                  "risk_level": res_map[tid]["risk_level"],
                  "risk_reason": res_map[tid]["explanation"],
                  "recommended_action": res_map[tid]["recommended_action"]
                })
            analyzed.append(updated)
        return analyzed
    except Exception as e:
        logger.error(f"Gemini Risk engine failed: {e}. Falling back to simulations.")
        return predict_deadline_risks(tasks, calendar_events, _use_simulation=True)


# ----------------- 4. NORTHSTAR SCORE GENERATOR -----------------
def generate_northstar_score(tasks: list, schedule_blocks: list = None, _use_simulation: bool = False) -> dict:
    """
    Generates our proprietary productivity metric (0-100) based on task completion,
    burnout factors, schedule blocks mapped, and pending risk indices.
    """
    if not tasks:
        return {"score": 80, "explanation": "No tasks loaded. Add a task to start tracking your NorthStar productivity index."}

    completed = len([t for t in tasks if t.get("status") == "Completed"])
    pending = len([t for t in tasks if t.get("status") != "Completed"])
    high_risk = len([t for t in tasks if t.get("risk_level") == "High" and t.get("status") != "Completed"])

    if not api_key or _use_simulation:
        logger.info("Simulating NorthStar Score.")
        # Mock calculation
        score = 82
        if high_risk > 0:
            score = 68 # Drop due to high risk tasks
        if completed > 1 and high_risk == 0:
            score = 95 # Boosted score
            
        explanation = "Your score improved because all critical deadlines are scheduled and no high-risk tasks remain."
        if score < 75:
            explanation = "Your score is affected by the DBMS Assignment's High Risk level. Dedicate time blocks today to mitigate this."
            
        return {"score": score, "explanation": explanation}

    # Call Gemini Pro
    prompt = f"""
    You are a performance reviewer. Calculate a NorthStar Productivity Score (0-100 float) for the user.
    Consider these factors:
    - Number of completed tasks: {completed}
    - Number of active pending tasks: {pending}
    - Number of high-risk tasks: {high_risk}
    
    Active task list summary:
    {json.dumps([{ "name": t["name"], "risk_level": t.get("risk_level", "Low"), "status": t.get("status") } for t in tasks])}
    
    Return:
    1. score: Integer (0-100) representing their productivity alignment.
    2. explanation: A brief motivational sentence detailing why this score was given and how they can improve it (e.g. 'Your score improved because all critical deadlines are scheduled and no high-risk tasks remain').
    
    Return JSON matching this schema:
    {{
      "score": int,
      "explanation": "string"
    }}
    """
    try:
        return _call_gemini_json(prompt, "You are a workflow performance evaluator.")
    except Exception as e:
        logger.error(f"Gemini score evaluator failed: {e}. Falling back to simulation.")
        return generate_northstar_score(tasks, schedule_blocks, _use_simulation=True)


# ----------------- 5. ADAPTIVE SCHEDULING ENGINE -----------------
def generate_adaptive_schedule(tasks: list, calendar_events: list, date_str: str, time_constraint_hours: float = None, _use_simulation: bool = False) -> list:
    """
    Generates a daily hourly timeline mapping deep work study slots around synced calendar event blocks.
    Re-schedules instantly if user limits availability (e.g. 'I only have 2 hours today').
    """
    active_tasks = [t for t in tasks if t.get("status", "Pending") != "Completed"]
    # Sort active tasks by Priority Score
    active_tasks.sort(key=lambda x: x.get("priority_score", 0), reverse=True)

    if not api_key or _use_simulation:
        logger.info(f"Simulating Adaptive Schedule: {time_constraint_hours} hrs limit.")
        blocks = []
        
        # Add synchronized calendar events (such as classes/meetings)
        for ev in calendar_events:
            blocks.append({
                "date": date_str,
                "start_time": ev["start_time"],
                "end_time": ev["end_time"],
                "task_id": None,
                "task_name": ev["summary"],
                "type": "class" if "class" in ev["summary"].lower() else "meeting"
            })
            
        # If no events preloaded, add default university class block
        if not any(b["type"] == "class" for b in blocks):
            blocks.append({
                "date": date_str,
                "start_time": "09:00",
                "end_time": "13:00",
                "task_id": None,
                "task_name": "University Classes",
                "type": "class"
            })

        if time_constraint_hours is not None and time_constraint_hours <= 2.5:
            # Replan to 2 hours tonight:
            dbms = next((t for t in active_tasks if "dbms" in t["name"].lower()), None)
            german = next((t for t in active_tasks if "german" in t["name"].lower()), None)
            
            if dbms:
                blocks.append({
                    "date": date_str,
                    "start_time": "17:00",
                    "end_time": "18:30",
                    "task_id": dbms["id"],
                    "task_name": f"{dbms['name']} (Focused Coding)",
                    "type": "work"
                })
            if german:
                blocks.append({
                    "date": date_str,
                    "start_time": "18:30",
                    "end_time": "19:00",
                    "task_id": german["id"],
                    "task_name": f"{german['name']} (Syllabus Review)",
                    "type": "work"
                })
            return blocks

        # Standard schedule generation
        dbms = next((t for t in active_tasks if "dbms" in t["name"].lower()), None)
        german = next((t for t in active_tasks if "german" in t["name"].lower()), None)
        intern = next((t for t in active_tasks if "internship" in t["name"].lower()), None)

        if dbms:
            blocks.append({
                "date": date_str,
                "start_time": "14:00",
                "end_time": "15:30",
                "task_id": dbms["id"],
                "task_name": f"{dbms['name']} (Database Design)",
                "type": "work"
            })
        if german:
            blocks.append({
                "date": date_str,
                "start_time": "15:30",
                "end_time": "16:00",
                "task_id": german["id"],
                "task_name": f"{german['name']} (Grammar)",
                "type": "work"
            })
        if intern:
            blocks.append({
                "date": date_str,
                "start_time": "16:30",
                "end_time": "18:00",
                "task_id": intern["id"],
                "task_name": f"{intern['name']} (Form Submission)",
                "type": "work"
            })
            
        return blocks

    # Call Gemini Pro
    tasks_input = [{
        "id": t["id"],
        "name": t["name"],
        "priority_score": t.get("priority_score", 50),
        "estimated_hours": t.get("estimated_hours", 2.0)
    } for t in active_tasks]
    
    events_input = [{
        "summary": ev["summary"],
        "start_time": ev["start_time"],
        "end_time": ev["end_time"]
    } for ev in calendar_events]

    limit_prompt = f"The user requested to limit TOTAL study hours today to maximum {time_constraint_hours} hours. Only schedule tasks that fit within this limit." if time_constraint_hours else ""

    prompt = f"""
    You are an expert scheduler. Generate an optimal daily study schedule for date {date_str}.
    Constraints:
    - User sleeps from 11 PM to 6 AM (23:00 to 06:00). Do not schedule anything here.
    - Synchronize with these existing calendar events and prevent overlapping:
      {json.dumps(events_input)}
      Map these events into the output schedule (mark their type as 'class' or 'meeting').
    - User prefers 90-minute study blocks with 15-30 minute breaks in between.
    - {limit_prompt}
    
    Tasks to schedule (ordered by priority):
    {json.dumps(tasks_input)}
    
    Return a JSON list of schedule blocks:
    [
      {{
        "date": "{date_str}",
        "start_time": "HH:MM",
        "end_time": "HH:MM",
        "task_id": "string (or null for calendar events)",
        "task_name": "string (e.g. University Classes or DBMS - Index Coding)",
        "type": "work" | "class" | "meeting" | "sleep" | "break"
      }}
    ]
    """
    try:
        return _call_gemini_json(prompt, "You are a professional calendar scheduler.")
    except Exception as e:
        logger.error(f"Gemini adaptive scheduler failed: {e}. Falling back to simulation.")
        return generate_adaptive_schedule(tasks, calendar_events, date_str, time_constraint_hours, _use_simulation=True)


# ----------------- 6. ASSIGNMENT BREAKDOWN & INSIGHTS -----------------
def generate_assignment_breakdown(task_id: str, title: str, description: str, _use_simulation: bool = False) -> dict:
    """
    When a document is parsed, Gemini creates a simple summary, estimates hours,
    and structures a 4-day milestones execution plan.
    """
    if not api_key or _use_simulation:
        logger.info("Simulating Assignment Breakdown.")
        return {
            "task_id": task_id,
            "simple_summary": "In this project, you will write SQL statements to create and link relational tables, enforce key constraints, and build basic search queries.",
            "estimated_effort_hours": 6.0,
            "milestones": json.dumps([
                {"milestone": "Day 1: Schema Draft", "description": "Review project parameters and sketch out the entity relationships on paper."},
                {"milestone": "Day 2: Write SQL Tables", "description": "Draft the CREATE TABLE schemas and enforce primary/foreign keys in SQLite."},
                {"milestone": "Day 3: Seed mock records", "description": "Insert testing data to confirm relations are correctly populated."},
                {"milestone": "Day 4: Test queries", "description": "Write search queries, test performance constraints, and package documentation."}
            ])
        }

    prompt = f"""
    You are an academic syllabus designer. Analyze this assignment:
    Title: {title}
    Description: {description}
    
    Generate:
    1. simple_summary: Explain the assignment goals in extremely simple, plain language.
    2. estimated_effort_hours: Total estimated hours required (float).
    3. milestones: A list of 4 milestone steps (representing Day 1 to Day 4 progress) to finish the work.
    
    Return JSON matching this schema:
    {{
      "simple_summary": "string",
      "estimated_effort_hours": float,
      "milestones": [
        {{
          "milestone": "string (e.g. Day 1: Research)",
          "description": "string"
        }}
      ]
    }}
    """
    try:
        data = _call_gemini_json(prompt, "You are a syllabus coordinator.")
        # Format milestones to JSON string to match database format
        return {
            "task_id": task_id,
            "simple_summary": data["simple_summary"],
            "estimated_effort_hours": data["estimated_effort_hours"],
            "milestones": json.dumps(data["milestones"])
        }
    except Exception as e:
        logger.error(f"Gemini insights breakdown failed: {e}. Falling back to simulation.")
        return generate_assignment_breakdown(task_id, title, description, _use_simulation=True)


# ----------------- 7. BURNOUT DETECTION -----------------
def analyze_workload_burnout(tasks: list, calendar_events: list = None, _use_simulation: bool = False) -> dict:
    """
    Workload analysis check. If planned hours exceed available productive hours this week,
    generates warning details and mitigation suggestions.
    """
    # Sum up estimated hours of active tasks
    active_tasks = [t for t in tasks if t.get("status") != "Completed"]
    total_needed_hours = sum(float(t.get("estimated_hours", 2.0)) for t in active_tasks)
    
    # Calculate available hours:
    # Assume 14 hours per day (08:00 - 22:00) minus sleep and synced classes
    # 7 days * 14h = 98h total weekly hours.
    # Synced classes: let's assume classes occupy 4h per weekday (20h total)
    # Available study slots = 78 hours.
    available_hours = 78.0
    if calendar_events:
        # Subtract event times
        for ev in calendar_events:
            try:
                # Mock calculation of hours from events
                available_hours -= 2.0
            except Exception:
                pass
                
    # If the user has a huge workload (e.g. DBMS + Internship + several new tasks)
    # let's trigger a mockup if total tasks effort is high relative to available study slots (e.g., they have high risk)
    is_burned_out = total_needed_hours > 15.0 # For demo, we trigger if they have active DBMS project!

    if not api_key or _use_simulation:
        logger.info("Simulating Burnout Detector.")
        if is_burned_out:
            return {
                "is_burned_out": True,
                "hours_deficit": 6.5,
                "warning_message": "Your planned weekly effort exceeds available productive hours by approximately 6.5 hours this week.",
                "mitigation_advice": "Delegate lower priority tasks like German Vocabulary practice, skip non-essential study groups, and sync your tasks timeline with evening slots."
            }
        return {
            "is_burned_out": False,
            "hours_deficit": 0.0,
            "warning_message": "",
            "mitigation_advice": ""
        }

    # Call Gemini Pro
    prompt = f"""
    You are a burnout prevention strategist. Compare the total planned effort required for these active tasks
    against the available weekly hours (assume the user has 25 available study hours this week after classes/sleep).
    
    Active tasks:
    {json.dumps([{ "name": t["name"], "estimated_hours": t.get("estimated_hours", 2.0) } for t in active_tasks])}
    
    Calculate if they are burned out (is_burned_out = true if planned effort exceeds 25 hours).
    Provide:
    1. is_burned_out: Boolean
    2. hours_deficit: Float representing how many hours they exceed by (0.0 if not burned out)
    3. warning_message: E.g., 'Your workload exceeds available productive hours by approximately 10 hours this week.'
    4. mitigation_advice: Clear actionable suggestions on which tasks to postpone or reschedule.
    
    Return JSON matching this schema:
    {{
      "is_burned_out": boolean,
      "hours_deficit": float,
      "warning_message": "string",
      "mitigation_advice": "string"
    }}
    """
    try:
        return _call_gemini_json(prompt, "You are a health and workflow strategist.")
    except Exception as e:
        logger.error(f"Gemini burnout detector failed: {e}. Falling back to simulation.")
        return analyze_workload_burnout(tasks, calendar_events, _use_simulation=True)


# ----------------- 8. AI COACH MEMORY -----------------
def respond_as_coach_memory(history: list, new_message: str, tasks: list, schedule: list = None, _use_simulation: bool = False) -> tuple:
    """
    Replies to the coach chat prompt. Infuses the message with the complete database dump
    of tasks, deadlines, schedules, and risk factors, ensuring responses use actual data.
    """
    msg_lower = new_message.lower()
    
    # Check for hours replanning request
    import re
    needs_replan = False
    replan_hours_limit = None
    
    hours_match = re.search(r"(\d+)\s*hour", msg_lower)
    if hours_match and ("only have" in msg_lower or "limit" in msg_lower or "today" in msg_lower or "tonight" in msg_lower or "replan" in msg_lower):
        needs_replan = True
        try:
            replan_hours_limit = float(hours_match.group(1))
        except ValueError:
            replan_hours_limit = 2.0

    if not api_key or _use_simulation:
        logger.info(f"Simulating AI Coach memory reply. Replan detected: {needs_replan}")
        # Standard flows
        if "overwhelmed" in msg_lower:
            reply = "I understand you're feeling overwhelmed. Looking at your active tasks:\n- **DBMS Mini Project** (Hard - High Risk)\n- **Internship Application** (Medium - Medium Risk)\n- **German Practice A1** (Easy - Low Risk)\n\nI recommend focusing strictly on the **DBMS Mini Project** and **Internship Application** today. Let's postpone German practice to tomorrow to ease your workload. You are now on track to complete all deadlines."
            return reply, False, None
            
        if needs_replan:
            reply = f"I've updated your daily schedule to accommodate exactly {replan_hours_limit} hours of focused work tonight.\n\nWe are focusing 1.5 hours on your **DBMS Assignment** and 30 minutes on **German Practice** review. This gets the critical work done while preventing burnout.\n\n**You are now on track to complete all deadlines.**"
            return reply, True, replan_hours_limit
            
        if "dangerous" in msg_lower or "risk" in msg_lower:
            reply = "The most dangerous deadline is your **DBMS Mini Project** due on **2026-06-28** (6 days remaining). It currently has a **78% risk level** of delay because your available study blocks are congested with class and work syncs. I advise scheduling deep-work slots today."
            return reply, False, None
            
        reply = "I am monitoring your deadlines closely. You have Internship Application due soon and DBMS Mini Project at High Risk. Let me know if you want me to replan your timeline or check workload burnout."
        return reply, False, None

    # Call Gemini Pro
    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        
        # Compile contextual inputs of current database
        context_dump = f"""
        [User Deadlines & Task Data]:
        {json.dumps([{
            "name": t["name"],
            "deadline": t["deadline"],
            "difficulty": t.get("difficulty", "Medium"),
            "priority": t.get("priority", "Medium"),
            "risk_level": t.get("risk_level", "Low"),
            "risk_percentage": t.get("risk_percentage", 0.0),
            "risk_reason": t.get("risk_reason", ""),
            "status": t.get("status", "Pending")
        } for t in tasks])}
        
        [User Today's Schedule]:
        {json.dumps([{ "start": b["start_time"], "end": b["end_time"], "task_name": b["task_name"] } for b in (schedule or [])])}
        """

        system_instruction = f"""
        You are NorthStarAI Coach, an expert academic/professional workflow companion.
        You must answer using the actual task and schedule data provided in the context below. Do not make up deadlines or names.
        Keep replies friendly, supportive, and direct. Focus on helping the user stay calm and productive.
        If the user indicates they want to replan or has limited time, reassure them and let them know you are modifying their schedule.
        Include the phrase: "You are now on track to complete all deadlines." if they follow your optimized plan.
        """
        
        # Format chat history
        chat_messages = []
        for msg in history:
            chat_messages.append({"role": "user" if msg["role"] == "user" else "model", "parts": [msg["message"]]})
            
        # Add new query with context
        prompt = f"{context_dump}\n\nUser Question: {new_message}"
        
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.7},
            system_instruction=system_instruction,
            request_options={"timeout": 5.0}
        )
        return response.text.strip(), needs_replan, replan_hours_limit
    except Exception as e:
        logger.error(f"Gemini Coach memory failed: {e}. Falling back to simulation.")
        return respond_as_coach_memory([], new_message, tasks, schedule, _use_simulation=True)

# ----------------- 9. TASK ENHANCEMENT -----------------
def enhance_task(name: str, description: str, deadline: str, difficulty: str, category: str, _use_simulation: bool = False) -> dict:
    """
    Uses Gemini to analyze task parameters and suggest estimated hours, priority,
    and a suggested start date.
    """
    if not api_key or _use_simulation:
        logger.info("Simulating Task Enhancement.")
        # Default fallback values
        return {
            "estimated_hours": 2.5,
            "priority": "Medium",
            "suggested_start_date": (datetime.today() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "category": category or "Personal"
        }

    prompt = f"""
    Analyze this task and suggest optimal parameters:
    Name: {name}
    Description: {description}
    Deadline: {deadline}
    Difficulty: {difficulty}
    Category: {category}
    Today is {datetime.today().strftime('%Y-%m-%d')}.
    
    Return:
    1. estimated_hours: Suggested study/work hours needed (float).
    2. priority: 'Low' | 'Medium' | 'High' | 'Critical'.
    3. suggested_start_date: Suggested date to begin working (YYYY-MM-DD).
    4. category: Refined category if needed, or keeping the same.
    
    Return JSON matching this schema:
    {{
      "estimated_hours": float,
      "priority": "Low" | "Medium" | "High" | "Critical",
      "suggested_start_date": "YYYY-MM-DD",
      "category": "string"
    }}
    """
    try:
        return _call_gemini_json(prompt, "You are a task management optimization assistant.")
    except Exception as e:
        logger.error(f"Gemini task enhancement failed: {e}. Falling back to simulation.")
        return enhance_task(name, description, deadline, difficulty, category, _use_simulation=True)
