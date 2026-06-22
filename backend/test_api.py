import os
import sys
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)

def test_root_endpoint():
    """Verify that root system diagnostic endpoint returns 200 OK."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["app"] == "NorthStarAI Backend"

def test_demo_reset_endpoint():
    """Verify database reset endpoint correctly loads initial demo tasks."""
    response = client.post("/api/demo/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    
    # Check if reset loaded the 2 mock tasks
    tasks_response = client.get("/api/tasks")
    assert tasks_response.status_code == 200
    tasks = tasks_response.json()
    assert len(tasks) == 2
    task_names = [t["name"] for t in tasks]
    assert "Internship Application" in task_names
    assert "German Practice A1" in task_names

def test_task_crud():
    """Verify task creation and fetch capabilities."""
    # Create manual task
    payload = {
        "name": "Math Homework 4",
        "description": "Calculus derivatives sheets",
        "deadline": "2026-06-30",
        "difficulty": "Easy",
        "category": "Academic"
      }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 200
    task = response.json()
    assert task["name"] == "Math Homework 4"
    assert task["estimated_hours"] > 0
    assert task["status"] == "Pending"
    
    # Verify update
    task_id = task["id"]
    update_payload = {"status": "In Progress"}
    update_res = client.put(f"/api/tasks/{task_id}", json=update_payload)
    assert update_res.status_code == 200
    updated_task = update_res.json()
    assert updated_task["status"] == "In Progress"
    
    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 200

def test_prioritize_and_schedule():
    """Verify prioritization score blending and daily study slot schedule mapping."""
    # Reset first to put standard tasks
    client.post("/api/demo/reset")
    
    # Trigger AI prioritize
    p_res = client.post("/api/tasks/prioritize")
    assert p_res.status_code == 200
    prioritized_tasks = p_res.json()
    assert len(prioritized_tasks) == 2
    # German and Internship should have Priority Index calculated
    for t in prioritized_tasks:
        assert t["priority_index"] > 0
        assert t["urgency_score"] > 0
        assert t["impact_score"] > 0
        
    # Generate schedule
    s_res = client.post("/api/schedule/generate?date=2026-06-22")
    assert s_res.status_code == 200
    schedule_blocks = s_res.json()
    assert len(schedule_blocks) > 0
    
    # Check block structure
    for b in schedule_blocks:
        assert "start_time" in b
        assert "end_time" in b
        assert "task_name" in b

def test_coach_chat():
    """Verify chat coach conversational context replies."""
    # Simple greeting query
    response = client.post("/api/coach/chat", json={"message": "Hello coach, what are my goals?"})
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 0

if __name__ == "__main__":
    import pytest
    print("Running automated backend API tests...")
    sys.exit(pytest.main([__file__]))
