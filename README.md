# 🧭 NorthStarAI

### Your AI Productivity Navigator

NorthStarAI is an AI-powered productivity companion that helps users plan, prioritize, and complete tasks before deadlines are missed.

Unlike traditional productivity tools that rely on passive reminders, NorthStarAI proactively analyzes workloads, predicts deadline risks, generates adaptive schedules, and provides personalized guidance using Google's Gemini models.

---

## 🚀 Problem Statement

Students, professionals, and job seekers frequently miss deadlines because they:

* Underestimate effort required
* Struggle to prioritize competing tasks
* Become overwhelmed by workload
* Fail to adapt when schedules change

Existing productivity tools remind users of deadlines.

NorthStarAI helps users avoid missing them in the first place.

---

## ✨ Key Features

### 📄 AI Deadline Extraction

Upload:

* Assignment screenshots
* PDFs
* Email screenshots
* Syllabus images

Gemini Vision automatically extracts:

* Task title
* Deadline
* Description
* Estimated effort

---

### 🎯 Smart Prioritization Engine

Each task is evaluated using:

* Urgency
* Impact
* Effort
* Deadline proximity

NorthStarAI generates a dynamic Priority Score and explains its reasoning.

---

### ⚠️ AI Risk Predictor

Detects tasks likely to miss deadlines.

Provides:

* Risk percentage
* Risk level
* Explanations
* Mitigation recommendations

---

### 📅 Adaptive Schedule Generator

Creates personalized study and work plans based on:

* Available hours
* Existing commitments
* Task effort estimates
* Deadline constraints

Schedules automatically update when circumstances change.

---

### 🤖 AI Coach

Users can ask:

* What should I work on today?
* Replan my schedule.
* I only have 2 hours available.
* Which deadline is most dangerous?

Responses are generated using real task data.

---

### 📊 Productivity Analytics

Track:

* Completion rates
* Productivity score
* Risk trends
* Weekly performance

---

## 🏗️ System Architecture

```text
                        ┌─────────────────┐
                        │      User       │
                        └────────┬────────┘
                                 │
                                 ▼
                     ┌──────────────────────┐
                     │ Next.js Frontend UI  │
                     └────────┬─────────────┘
                              │ REST API
                              ▼
                    ┌───────────────────────┐
                    │ FastAPI Backend       │
                    └────────┬──────────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼

   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │ Gemini Vision│  │ Gemini Pro   │  │ SQLite DB    │
   │ OCR Analysis │  │ Reasoning AI │  │ Task Storage │
   └──────────────┘  └──────────────┘  └──────────────┘

            │                │
            └────────┬───────┘
                     ▼

          Prioritization Engine
          Risk Prediction Engine
          Schedule Generator
          AI Coach Responses
```

---

## 🛠️ Tech Stack

| Layer            | Technology               |
| ---------------- | ------------------------ |
| Frontend         | Next.js 15, TypeScript   |
| Styling          | TailwindCSS              |
| Backend          | FastAPI                  |
| Database         | SQLite (Firestore Ready) |
| ORM              | SQLAlchemy               |
| AI Models        | Gemini 2.5 Pro           |
| Vision OCR       | Gemini 2.5 Flash         |
| Charts           | Recharts                 |
| Authentication   | Google Authentication    |
| Deployment Ready | Vercel + FastAPI         |

---

## 📂 Project Structure

```text
NorthStarAI/
│
├── backend/
│   ├── config.py
│   ├── database.py
│   ├── gemini_service.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/app/
│   ├── src/components/
│   ├── src/context/
│   └── package.json
│
└── README.md
```

---

## 🎬 Demo Workflow

### Step 1

Upload assignment screenshot.

### Step 2

Gemini extracts:

* Title
* Deadline
* Description
* Estimated effort

### Step 3

Task is automatically created.

### Step 4

AI prioritizes all tasks.

### Step 5

Risk Predictor identifies dangerous deadlines.

### Step 6

Adaptive schedule is generated.

### Step 7

AI Coach replans workload instantly when user availability changes.

---

## 📈 Example Use Case

User uploads:

> DBMS Mini Project
> Due: June 28

NorthStarAI:

✅ Extracts deadline

✅ Estimates effort

✅ Calculates priority score

✅ Detects risk of delay

✅ Generates study schedule

✅ Replans if user availability changes

---

## 🔮 Future Scope

* Real Google Calendar Integration
* Gmail Assignment Detection
* Mobile Application
* Team Productivity Mode
* Burnout Prediction Engine
* Multi-Agent AI Planning
* Voice Assistant Support

---

## 🏆 Built For

Google AI Studio Hackathon

Powered by Gemini 2.5 Pro and Gemini 2.5 Flash.
