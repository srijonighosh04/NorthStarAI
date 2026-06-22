"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import LoginScreen from "../components/LoginScreen";

export interface Task {
  id: string;
  name: string;
  description: string;
  deadline: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  status: "Pending" | "In Progress" | "Completed";
  estimated_hours: number;
  priority: "Low" | "Medium" | "High" | "Critical";
  suggested_start_date?: string;
  urgency: number;
  impact: number;
  effort: number;
  priority_score: number;
  priority_index: number; // visual duplicate index compatibility
  reasoning?: string;
  risk_level: "Low" | "Medium" | "High";
  risk_percentage: number;
  risk_reason?: string;
  recommended_action?: string;
  confidence_score?: number;
  extraction_summary?: string;
}

export interface ScheduleBlock {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  task_id: string | null;
  task_name: string;
  type: "work" | "class" | "meeting" | "sleep" | "break";
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  message: string;
  timestamp: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start_time: string;
  end_time: string;
  is_synced: boolean;
}

export interface BurnoutInfo {
  is_burned_out: boolean;
  hours_deficit: number;
  warning_message: string;
  mitigation_advice: string;
}

export interface AssignmentInsight {
  task_id: string;
  simple_summary: string;
  estimated_effort_hours: number;
  milestones: string; // JSON string of milestones
}

interface DemoContextType {
  tasks: Task[];
  schedule: ScheduleBlock[];
  chatHistory: ChatMessage[];
  calendarEvents: CalendarEvent[];
  northStarScore: { score: number; explanation: string };
  burnoutInfo: BurnoutInfo;
  apiConnected: boolean;
  currentStep: number;
  isLoading: boolean;
  activeTaskId: string | null;
  focusTimer: number; // in seconds
  isFocusRunning: boolean;
  showFocusOverlay: boolean;
  
  // Auth state
  isAuthenticated: boolean;
  user: { name: string; email: string; avatar: string } | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Actions
  fetchTasks: () => Promise<void>;
  fetchSchedule: (date: string) => Promise<void>;
  fetchChatHistory: () => Promise<void>;
  fetchCalendarEvents: () => Promise<void>;
  fetchProductivityData: () => Promise<void>;
  createTask: (name: string, description: string, deadline: string, difficulty: string, category: string) => Promise<void>;
  updateTaskStatus: (id: string, status: "Pending" | "In Progress" | "Completed") => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  triggerPrioritization: () => Promise<void>;
  triggerScheduleGeneration: (date: string, limitHours?: number) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  clearChat: () => Promise<void>;
  syncGoogleCalendar: () => Promise<void>;
  getTaskInsights: (id: string) => Promise<AssignmentInsight | null>;
  
  // Focus Mode Actions
  startFocusMode: (taskId: string) => void;
  pauseFocusMode: () => void;
  stopFocusMode: () => void;
  closeFocusOverlay: () => void;
  
  // Demo Actions
  resetDemoState: () => Promise<void>;
  nextDemoStep: () => Promise<void>;
  setDemoStep: (step: number) => void;
  runFullDemo: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const BACKEND_URL = "http://localhost:8000";

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [northStarScore, setNorthStarScore] = useState<{ score: number; explanation: string }>({ score: 82, explanation: "Schedules initialized." });
  const [burnoutInfo, setBurnoutInfo] = useState<BurnoutInfo>({ is_burned_out: false, hours_deficit: 0.0, warning_message: "", mitigation_advice: "" });
  const [apiConnected, setApiConnected] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Auth state variables (defaulted to true now so user immediately lands on dashboard, but login code fully remains toggleable)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>({
    name: "Srijoni Ghosh",
    email: "srijoni.ghosh@gmail.com",
    avatar: "SG"
  });
  
  // Focus Mode State
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [focusTimer, setFocusTimer] = useState<number>(1500); // 25 min default
  const [isFocusRunning, setIsFocusRunning] = useState<boolean>(false);
  const [showFocusOverlay, setShowFocusOverlay] = useState<boolean>(false);

  // Check API health on mount
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/`);
        if (res.ok) {
          setApiConnected(true);
          console.log("Connected to FastAPI Backend.");
        } else {
          setApiConnected(false);
        }
      } catch (e) {
        setApiConnected(false);
        console.log("FastAPI backend offline. Running in Simulation Mode.");
      }
    };
    checkApi();
  }, []);

  // Poll tasks & schedule once on load
  useEffect(() => {
    if (apiConnected) {
      refreshAllData();
    } else {
      loadLocalMockState();
    }
  }, [apiConnected]);

  // Focus Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isFocusRunning && focusTimer > 0) {
      interval = setInterval(() => {
        setFocusTimer((prev) => prev - 1);
      }, 1000);
    } else if (focusTimer === 0) {
      setIsFocusRunning(false);
    }
    return () => clearInterval(interval);
  }, [isFocusRunning, focusTimer]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setUser({
      name: "Srijoni Ghosh",
      email: "srijoni.ghosh@gmail.com",
      avatar: "SG"
    });
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshAllData = async () => {
    await fetchTasks();
    const todayStr = new Date().toISOString().split("T")[0];
    await fetchSchedule(todayStr);
    await fetchChatHistory();
    await fetchCalendarEvents();
    await fetchProductivityData();
  };

  const loadLocalMockState = () => {
    const internshipDl = new Date();
    internshipDl.setDate(internshipDl.getDate() + 3);
    const germanDl = new Date();
    germanDl.setDate(germanDl.getDate() + 4);

    const initialTasks: Task[] = [
      {
        id: "demo-internship-app",
        name: "Internship Application",
        description: "Submit application to major tech companies and update portfolio website.",
        deadline: internshipDl.toISOString().split("T")[0],
        difficulty: "Medium",
        category: "Career",
        status: "Pending",
        estimated_hours: 3.0,
        priority: "High",
        suggested_start_date: new Date().toISOString().split("T")[0],
        urgency: 82.0,
        impact: 98.0,
        effort: 50.0,
        priority_score: 98.0,
        priority_index: 98.0,
        reasoning: "High priority because portfolio review requires active submission before the 3-day deadline.",
        risk_level: "Medium",
        risk_percentage: 42.0,
        risk_reason: "Limited days left. Need to finalize website portfolio structure.",
        recommended_action: "Schedule 1.5h study session block today to complete submission.",
        confidence_score: 1.0,
        extraction_summary: ""
      },
      {
        id: "demo-german-practice",
        name: "German Practice A1",
        description: "Learn numbers, greetings, and basic noun declensions.",
        deadline: germanDl.toISOString().split("T")[0],
        difficulty: "Easy",
        category: "Skill-building",
        status: "Pending",
        estimated_hours: 1.0,
        priority: "Medium",
        suggested_start_date: new Date().toISOString().split("T")[0],
        urgency: 55.0,
        impact: 60.0,
        effort: 30.0,
        priority_score: 61.0,
        priority_index: 61.0,
        reasoning: "Low priority. Simple practice sheets easily completed in one sitting.",
        risk_level: "Low",
        risk_percentage: 12.0,
        risk_reason: "Sufficient buffer time left before deadline.",
        recommended_action: "Complete basic grammar practice blocks when scheduled.",
        confidence_score: 1.0,
        extraction_summary: ""
      }
    ];
    setTasks(initialTasks);

    // Sync Calendar Events
    const initialEvents: CalendarEvent[] = [
      {
        id: "cal-event-1",
        summary: "DBMS Practical Lecture Class",
        start_time: "09:00",
        end_time: "13:00",
        is_synced: true
      },
      {
        id: "cal-event-2",
        summary: "Internship Sync Interview Review",
        start_time: "14:00",
        end_time: "15:00",
        is_synced: true
      }
    ];
    setCalendarEvents(initialEvents);

    // Initial Schedule for today
    const todayStr = new Date().toISOString().split("T")[0];
    const initialSchedule: ScheduleBlock[] = [
      {
        id: "block-class",
        date: todayStr,
        start_time: "09:00",
        end_time: "13:00",
        task_id: null,
        task_name: "DBMS Practical Lecture Class",
        type: "class"
      },
      {
        id: "block-meeting",
        date: todayStr,
        start_time: "14:00",
        end_time: "15:00",
        task_id: null,
        task_name: "Internship Sync Interview Review",
        type: "meeting"
      },
      {
        id: "block-1",
        date: todayStr,
        start_time: "15:30",
        end_time: "16:30",
        task_id: "demo-german-practice",
        task_name: "German Practice A1 (Vocabulary review)",
        type: "work"
      },
      {
        id: "block-2",
        date: todayStr,
        start_time: "17:00",
        end_time: "18:30",
        task_id: "demo-internship-app",
        task_name: "Internship Application (Resume Submission)",
        type: "work"
      }
    ];
    setSchedule(initialSchedule);
    setChatHistory([]);
    setNorthStarScore({ score: 82, explanation: "Schedules initialized. Keep completing blocks to improve." });
    setBurnoutInfo({ is_burned_out: false, hours_deficit: 0.0, warning_message: "", mitigation_advice: "" });
    setCurrentStep(0);
  };

  const fetchTasks = async () => {
    if (!apiConnected) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSchedule = async (date: string) => {
    if (!apiConnected) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/schedule?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchChatHistory = async () => {
    if (!apiConnected) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/coach/history`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCalendarEvents = async () => {
    if (!apiConnected) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/calendar/events`);
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProductivityData = async () => {
    if (!apiConnected) return;
    try {
      const scoreRes = await fetch(`${BACKEND_URL}/api/productivity/score`);
      if (scoreRes.ok) {
        const scoreData = await scoreRes.json();
        setNorthStarScore(scoreData);
      }
      
      const burnoutRes = await fetch(`${BACKEND_URL}/api/productivity/burnout`);
      if (burnoutRes.ok) {
        const burnoutData = await burnoutRes.json();
        setBurnoutInfo(burnoutData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const createTask = async (name: string, description: string, deadline: string, difficulty: string, category: string) => {
    setIsLoading(true);
    if (apiConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, deadline, difficulty, category })
        });
        if (res.ok) {
          await refreshAllData();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        const newTask: Task = {
          id: `task-${Date.now()}`,
          name,
          description,
          deadline,
          difficulty: difficulty as any,
          category,
          status: "Pending",
          estimated_hours: difficulty === "Hard" ? 5.0 : difficulty === "Medium" ? 3.0 : 1.5,
          priority: difficulty === "Hard" ? "High" : "Medium",
          urgency: 50.0,
          impact: difficulty === "Hard" ? 85.0 : 50.0,
          effort: difficulty === "Hard" ? 70.0 : 40.0,
          priority_score: difficulty === "Hard" ? 78.0 : 55.0,
          priority_index: difficulty === "Hard" ? 78.0 : 55.0,
          risk_level: "Low",
          risk_percentage: 15.0
        };
        setTasks((prev) => [...prev, newTask]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const updateTaskStatus = async (id: string, status: "Pending" | "In Progress" | "Completed") => {
    if (apiConnected) {
      try {
        await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        });
        await refreshAllData();
      } catch (e) {
        console.error(e);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t))
      );
    }
  };

  const deleteTask = async (id: string) => {
    if (apiConnected) {
      try {
        await fetch(`${BACKEND_URL}/api/tasks/${id}`, { method: "DELETE" });
        await refreshAllData();
      } catch (e) {
        console.error(e);
      }
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const triggerPrioritization = async () => {
    setIsLoading(true);
    if (apiConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/tasks/prioritize`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setTasks(data);
          await fetchProductivityData();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) => {
            const isDBMS = t.name.toLowerCase().includes("dbms");
            const isInternship = t.name.toLowerCase().includes("internship");
            if (isDBMS) {
              return { ...t, urgency: 98, impact: 92, effort: 80, priority_score: 92, priority_index: 92, priority: "High", reasoning: "High priority because deadline is within 6 days and requires 6 hours of schema work." };
            } else if (isInternship) {
              return { ...t, urgency: 82, impact: 98, effort: 50, priority_score: 98, priority_index: 98, priority: "High", reasoning: "Critical career impact. Deadline is very close, requires updates to CV portfolio." };
            }
            return t;
          })
        );
        setIsLoading(false);
      }, 1000);
    }
  };

  const triggerScheduleGeneration = async (date: string, limitHours?: number) => {
    setIsLoading(true);
    if (apiConnected) {
      try {
        const url = `${BACKEND_URL}/api/schedule/generate?date=${date}${limitHours ? `&available_hours=${limitHours}` : ""}`;
        const res = await fetch(url, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setSchedule(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        const blocks: ScheduleBlock[] = [];
        
        // Add Class block
        blocks.push({
          id: "block-class",
          date,
          start_time: "09:00",
          end_time: "13:00",
          task_id: null,
          task_name: "DBMS Practical Lecture Class",
          type: "class"
        });

        // Add Interview Sync
        blocks.push({
          id: "block-meeting",
          date,
          start_time: "14:00",
          end_time: "15:00",
          task_id: null,
          task_name: "Internship Sync Interview Review",
          type: "meeting"
        });

        if (limitHours && limitHours <= 2.5) {
          const dbmsTask = tasks.find((t) => t.name.toLowerCase().includes("dbms"));
          const germanTask = tasks.find((t) => t.name.toLowerCase().includes("german"));
          
          if (dbmsTask) {
            blocks.push({
              id: "block-replan-1",
              date,
              start_time: "17:00",
              end_time: "18:30",
              task_id: dbmsTask.id,
              task_name: `${dbmsTask.name} (Core Coding)`,
              type: "work"
            });
          }
          if (germanTask) {
            blocks.push({
              id: "block-replan-2",
              date,
              start_time: "18:30",
              end_time: "19:00",
              task_id: germanTask.id,
              task_name: `${germanTask.name} (Review)`,
              type: "work"
            });
          }
        } else {
          const dbmsTask = tasks.find((t) => t.name.toLowerCase().includes("dbms"));
          const germanTask = tasks.find((t) => t.name.toLowerCase().includes("german"));
          const internTask = tasks.find((t) => t.name.toLowerCase().includes("internship"));

          if (germanTask) {
            blocks.push({
              id: "block-demo-2",
              date,
              start_time: "15:30",
              end_time: "16:30",
              task_id: germanTask.id,
              task_name: `${germanTask.name} (Vocabulary review)`,
              type: "work"
            });
          }
          if (internTask) {
            blocks.push({
              id: "block-demo-3",
              date,
              start_time: "17:00",
              end_time: "18:30",
              task_id: internTask.id,
              task_name: `${internTask.name} (Resume Submission)`,
              type: "work"
            });
          }
          if (dbmsTask) {
            blocks.push({
              id: "block-demo-1",
              date,
              start_time: "19:00",
              end_time: "20:30",
              task_id: dbmsTask.id,
              task_name: `${dbmsTask.name} (Database Design)`,
              type: "work"
            });
          }
        }
        setSchedule(blocks);
        setIsLoading(false);
      }, 1000);
    }
  };

  const sendChatMessage = async (message: string) => {
    const userMsg: ChatMessage = {
      id: `chat-${Date.now()}`,
      role: "user",
      message,
      timestamp: new Date().toISOString()
    };
    
    setChatHistory((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (apiConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/coach/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message })
        });
        if (res.ok) {
          const data = await res.json();
          setChatHistory((prev) => [
            ...prev,
            {
              id: `chat-${Date.now() + 1}`,
              role: "model",
              message: data.reply,
              timestamp: new Date().toISOString()
            }
          ]);
          await refreshAllData();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        let reply = "I am analyzing your workload. Ask me what you should work on today or ask me to replan.";
        let triggerReplan = false;

        const msgLower = message.toLowerCase();
        if (msgLower.includes("overwhelmed")) {
          reply = "I understand you're feeling overwhelmed. Looking at your active tasks:\n- **DBMS Mini Project** (Hard - High Risk)\n- **Internship Application** (Medium - Medium Risk)\n- **German Practice A1** (Easy - Low Risk)\n\nI recommend focusing strictly on the **DBMS Mini Project** and **Internship Application** today. Let's postpone German practice to tomorrow to ease your workload. You are now on track to complete all deadlines.";
        } else if (msgLower.includes("2 hours") || msgLower.includes("2 hr")) {
          reply = "I've updated your daily schedule to accommodate exactly 2 hours of focused work tonight.\n\nWe are focusing 1.5 hours on your **DBMS Assignment** and 30 minutes on **German Practice** review. This gets the critical work done while preventing burnout.\n\n**You are now on track to complete all deadlines.**";
          triggerReplan = true;
        } else if (msgLower.includes("dangerous")) {
          reply = "The most dangerous deadline is your **DBMS Mini Project** due on **2026-06-28** (6 days remaining). It currently has a **78% risk level** of delay because your available study blocks are congested with class and work syncs. I advise scheduling deep-work slots today.";
        }

        setChatHistory((prev) => [
          ...prev,
          {
            id: `chat-${Date.now() + 1}`,
            role: "model",
            message: reply,
            timestamp: new Date().toISOString()
          }
        ]);
        
        if (triggerReplan) {
          const todayStr = new Date().toISOString().split("T")[0];
          const blocks: ScheduleBlock[] = [
            {
              id: "block-replan-1",
              date: todayStr,
              start_time: "17:00",
              end_time: "18:30",
              task_id: "demo-dbms-project",
              task_name: "DBMS Mini Project (Core Coding)",
              type: "work"
            },
            {
              id: "block-replan-2",
              date: todayStr,
              start_time: "18:30",
              end_time: "19:00",
              task_id: "demo-german-practice",
              task_name: "German Practice (Review)",
              type: "work"
            }
          ];
          setSchedule(blocks);
          
          setTasks((prev) =>
            prev.map((t) => {
              if (t.name.toLowerCase().includes("dbms")) {
                return {
                  ...t,
                  risk_level: "Low",
                  risk_percentage: 15.0,
                  risk_reason: "Safe. Balanced daily study slots scheduled.",
                  recommended_action: "Follow the updated 2-hour daily schedule slot."
                };
              }
              return t;
            })
          );
          
          setNorthStarScore({
            score: 95,
            explanation: "Your score improved because all critical deadlines are scheduled and no high-risk tasks remain."
          });
          setBurnoutInfo({
            is_burned_out: false,
            hours_deficit: 0.0,
            warning_message: "",
            mitigation_advice: ""
          });
        }
        setIsLoading(false);
      }, 1200);
    }
  };

  const clearChat = async () => {
    if (apiConnected) {
      try {
        await fetch(`${BACKEND_URL}/api/coach/clear`, { method: "POST" });
        setChatHistory([]);
      } catch (e) {
        console.error(e);
      }
    } else {
      setChatHistory([]);
    }
  };

  const syncGoogleCalendar = async () => {
    setIsLoading(true);
    if (apiConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/calendar/sync`, { method: "POST" });
        if (res.ok) {
          await refreshAllData();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        const syncedEvents: CalendarEvent[] = [
          {
            id: "cal-event-1",
            summary: "DBMS Practical Lecture Class",
            start_time: "09:00",
            end_time: "13:00",
            is_synced: true
          },
          {
            id: "cal-event-2",
            summary: "Internship Sync Interview Review",
            start_time: "14:00",
            end_time: "15:00",
            is_synced: true
          }
        ];
        setCalendarEvents(syncedEvents);
        setIsLoading(false);
      }, 1000);
    }
  };

  const getTaskInsights = async (id: string): Promise<AssignmentInsight | null> => {
    if (apiConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/tasks/${id}/insights`);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error(e);
      }
      return null;
    } else {
      // Local Simulation insights
      const task = tasks.find(t => t.id === id);
      if (!task) return null;
      
      const isDBMS = task.name.toLowerCase().includes("dbms");
      const isIntern = task.name.toLowerCase().includes("internship");
      const isGerman = task.name.toLowerCase().includes("german");

      let summary = `Elementary practice roadmap for completing ${task.name}.`;
      let effort = task.estimated_hours;
      let milestones: any[] = [];

      if (isDBMS) {
        summary = "Design relational schemas, build SQL CREATE tables, write insert commands, query constraints. Extracted from document screenshot.";
        milestones = [
          { milestone: "Day 1: Schema Draft", description: "Sketch entity relation parameters on paper." },
          { milestone: "Day 2: Write SQL Tables", description: "Write CREATE TABLE commands with primary/foreign keys." },
          { milestone: "Day 3: Seed mock records", description: "Populate test records and confirm relationships." },
          { milestone: "Day 4: Test queries", description: "Write index constraints and document findings." }
        ];
      } else if (isIntern) {
        summary = "Draft CV changes, update projects layout on CV portfolio, and submit job application form.";
        milestones = [
          { milestone: "Day 1: CV Review", description: "Proofread resume structures." },
          { milestone: "Day 2: Portfolio Check", description: "Check Github repository urls." },
          { milestone: "Day 3: Submit application", description: "Fill details and send forms." }
        ];
      } else if (isGerman) {
        summary = "Practice greetings and simple noun conjugates.";
        milestones = [
          { milestone: "Day 1: Vocab review", description: "Memorize numbers and basic introductions." },
          { milestone: "Day 2: Case practice", description: "Complete grammar exercises." }
        ];
      }

      return {
        task_id: id,
        simple_summary: summary,
        estimated_effort_hours: effort,
        milestones: JSON.stringify(milestones)
      };
    }
  };

  // ----------------- FOCUS MODE ACTIONS -----------------
  const startFocusMode = (taskId: string) => {
    setActiveTaskId(taskId);
    setFocusTimer(1500); // 25 min Pomodoro
    setIsFocusRunning(true);
    setShowFocusOverlay(true);
    updateTaskStatus(taskId, "In Progress");
  };

  const pauseFocusMode = () => {
    setIsFocusRunning(false);
  };

  const stopFocusMode = () => {
    setIsFocusRunning(false);
    setActiveTaskId(null);
  };

  const closeFocusOverlay = () => {
    setShowFocusOverlay(false);
  };

  // ----------------- HACKATHON DEMO ACTIONS -----------------
  const resetDemoState = async () => {
    setIsLoading(true);
    if (apiConnected) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/demo/reset`, { method: "POST" });
        if (res.ok) {
          await refreshAllData();
          setCurrentStep(0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
      loadLocalMockState();
      setIsLoading(false);
    }
  };

  const nextDemoStep = async () => {
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    
    if (nextStep === 1) {
      // Step 1: Simulated OCR vision upload DBMS project
      setIsLoading(true);
      if (apiConnected) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "DBMS Mini Project",
              description: "Design relational database schema. Code CREATE TABLE syntax, verify indexes, draft relation documentation.",
              deadline: "2026-06-28",
              difficulty: "Hard",
              category: "Academic"
            })
          });
          if (res.ok) {
            await refreshAllData();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setTimeout(() => {
          const extractedTask: Task = {
            id: "demo-dbms-project",
            name: "DBMS Mini Project",
            description: "Design relational database schema. Code CREATE TABLE syntax, verify indexes, draft relation documentation.",
            deadline: "2026-06-28",
            difficulty: "Hard",
            category: "Academic",
            status: "Pending",
            estimated_hours: 6.0,
            priority: "High",
            suggested_start_date: new Date().toISOString().split("T")[0],
            urgency: 0,
            impact: 0,
            effort: 0,
            priority_score: 0,
            priority_index: 0,
            risk_level: "Low",
            risk_percentage: 0,
            confidence_score: 0.94,
            extraction_summary: "RELATIONAL DATABASE: Code constraints, CREATE commands. Extracted via Vision."
          };
          setTasks((prev) => [...prev, extractedTask]);
          setIsLoading(false);
        }, 1200);
      }
    } else if (nextStep === 3) {
      // Step 3: AI prioritization calculation
      await triggerPrioritization();
    } else if (nextStep === 4) {
      // Step 4: AI schedule generation
      const todayStr = new Date().toISOString().split("T")[0];
      await triggerScheduleGeneration(todayStr);
    } else if (nextStep === 5) {
      // Step 5: Risk calculations & Burnout calculations
      setIsLoading(true);
      if (apiConnected) {
        try {
          // Force live API risk updates
          const res = await fetch(`${BACKEND_URL}/api/tasks?run_analysis=true`);
          if (res.ok) {
            await refreshAllData();
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      } else {
        setTimeout(() => {
          setTasks((prev) =>
            prev.map((t) => {
              if (t.name.toLowerCase().includes("dbms")) {
                return {
                  ...t,
                  risk_level: "High",
                  risk_percentage: 78.0,
                  risk_reason: "Not enough study slots left before the deadline. You have university classes and internship tasks occupying free evening slots.",
                  recommended_action: "Cancel secondary study blocks (like German vocabulary) tonight. Schedule a deep work block from 4:00 PM to 7:00 PM."
                };
              }
              return t;
            })
          );
          
          setNorthStarScore({
            score: 68,
            explanation: "Your score is affected by the DBMS Assignment's High Risk level. Dedicate time blocks today to mitigate this."
          });
          
          setBurnoutInfo({
            is_burned_out: true,
            hours_deficit: 6.5,
            warning_message: "Your planned weekly effort exceeds available productive hours by approximately 6.5 hours this week.",
            mitigation_advice: "Delegate lower priority tasks like German Vocabulary practice, skip non-essential study groups, and sync your tasks timeline with evening slots."
          });
          setIsLoading(false);
        }, 800);
      }
    } else if (nextStep === 6) {
      // Step 6: Chat replan message
      await sendChatMessage("I only have 2 hours tonight.");
    }
  };

  const setDemoStep = (step: number) => {
    setCurrentStep(step);
  };

  // Run full demo automation
  const runFullDemo = async () => {
    await resetDemoState();
    
    // Step-by-step timer loops to advance steps automagically
    const runStep = async (stepNum: number) => {
      await nextDemoStep();
      // wait for load transitions
      await new Promise(resolve => setTimeout(resolve, 3000));
    };

    await runStep(0); // Run Step 1 (Upload)
    // Step 2 is automatic after Step 1 finishes. Increment to Step 3.
    setCurrentStep(2);
    await runStep(2); // Run Step 3 (Prioritize)
    await runStep(3); // Run Step 4 (Schedule)
    await runStep(4); // Run Step 5 (Risk analysis)
    await runStep(5); // Run Step 6 (Chat Replan)
    // Step 7 completes automatically
  };

  return (
    <DemoContext.Provider
      value={{
        isAuthenticated,
        user,
        loginWithGoogle,
        logout,
        tasks,
        schedule,
        chatHistory,
        calendarEvents,
        northStarScore,
        burnoutInfo,
        apiConnected,
        currentStep,
        isLoading,
        activeTaskId,
        focusTimer,
        isFocusRunning,
        showFocusOverlay,
        fetchTasks,
        fetchSchedule,
        fetchChatHistory,
        fetchCalendarEvents,
        fetchProductivityData,
        createTask,
        updateTaskStatus,
        deleteTask,
        triggerPrioritization,
        triggerScheduleGeneration,
        sendChatMessage,
        clearChat,
        syncGoogleCalendar,
        getTaskInsights,
        startFocusMode,
        pauseFocusMode,
        stopFocusMode,
        closeFocusOverlay,
        resetDemoState,
        nextDemoStep,
        setDemoStep,
        runFullDemo
      }}
    >
      {isAuthenticated ? children : <LoginScreen />}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
