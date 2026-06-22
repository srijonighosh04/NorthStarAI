# NorthStarAI

**NorthStarAI (Deadline Guardian)** is an AI-powered productivity companion that actively helps users prevent missed deadlines by planning, prioritizing, and scheduling work using Gemini 2.5 Pro.

---

## 🌟 Tech Stack

*   **Frontend:** Next.js 15 (App Router), TypeScript, TailwindCSS, Lucide Icons, Recharts
*   **Backend:** FastAPI (Python), SQLAlchemy (SQLite by default, Firestore ready)
*   **AI:** Gemini 2.5 Pro (Google AI Studio) & Gemini 2.5 Flash (Vision OCR)
*   **Integrations:** Google CalendarSync (Simulated for local offline demo)

---

## 🚀 Getting Started

### 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `/backend` folder with your API key:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key
   ```
   *(Note: If no API key is provided, the backend falls back to high-fidelity mocks, so the hackathon demo works perfectly out of the box!)*
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The backend will be running at `http://localhost:8000`.

---

### 2. Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

---

## 🏆 Hackathon Demo Guide

NorthStarAI comes with a built-in **Interactive Demo Controller** on the dashboard. It automates the 7-step presentation flow:

1.  **Demo Reset**: Click "Reset Demo" on the controller. This loads two tasks: *Internship Application* (Medium, due in 3 days) and *German Practice* (Easy, due in 4 days).
2.  **Step 1: Upload Screenshot**: Click "Simulate OCR Upload" to upload an assignment PDF/screenshot. Under the hood, Gemini extracts title, deadline, and description for a **DBMS Mini Project** due on **June 28, 2026** (6 hours estimated).
3.  **Step 2: Auto-Add Task**: See the **DBMS Mini Project** slide onto the Kanban board and task lists.
4.  **Step 3: AI Prioritization**: Click "AI Prioritize" to see the urgency, impact, and effort calculations, assigning DBMS a Priority Index of **92** and Internship an index of **98**.
5.  **Step 4: AI Schedule Generation**: Generate the daily schedule. See the timeline map deep work study blocks.
6.  **Step 5: Missed Deadline Risk Alert**: The dashboard triggers a red warning: **DBMS Assignment has a 78% risk** of delay due to insufficient hours.
7.  **Step 6: Chat with Coach**: In the AI Coach panel, submit the message: *"I only have 2 hours today."*
8.  **Step 7: Instant Replan**: Gemini replans instantly, allocating 1.5 hours to DBMS and 30 mins to German. The screen updates, showing the success banner: **"You are now on track to complete all deadlines."**
