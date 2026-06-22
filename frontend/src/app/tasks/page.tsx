"use client";

import React, { useState } from "react";
import { useDemo, Task, AssignmentInsight } from "../../context/DemoContext";
import { 
  Plus, 
  UploadCloud, 
  Sparkles, 
  Clock, 
  Trash2, 
  Play, 
  CheckCircle,
  FileImage,
  ArrowRight,
  Brain,
  X,
  Calendar,
  Layers,
  Award
} from "lucide-react";

export default function TasksPage() {
  const { 
    tasks, 
    createTask, 
    updateTaskStatus, 
    deleteTask, 
    isLoading, 
    apiConnected,
    currentStep,
    nextDemoStep,
    getTaskInsights
  } = useDemo();

  // Modal manual states
  const [showAddModal, setShowAddModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskDiff, setTaskDiff] = useState("Medium");
  const [taskCat, setTaskCat] = useState("Academic");

  // AI enhanced manual states
  const [enhancing, setEnhancing] = useState(false);
  const [enhancedData, setEnhancedData] = useState<any>(null);

  // File Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);

  // Assignment Insights drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [insightData, setInsightData] = useState<AssignmentInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [showInsightsDrawer, setShowInsightsDrawer] = useState(false);

  // Kanban Columns
  const pendingTasks = tasks.filter((t) => t.status === "Pending");
  const progressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !taskDeadline) return;
    await createTask(taskName, taskDesc, taskDeadline, taskDiff, taskCat);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setTaskName("");
    setTaskDesc("");
    setTaskDeadline("");
    setTaskDiff("Medium");
    setTaskCat("Academic");
    setEnhancedData(null);
  };

  const handleAiEnhance = async () => {
    if (!taskName || !taskDeadline) return;
    setEnhancing(true);
    try {
      if (apiConnected) {
        const res = await fetch("http://localhost:8000/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: taskName,
            description: taskDesc,
            deadline: taskDeadline,
            difficulty: taskDiff,
            category: taskCat
          })
        });
        if (res.ok) {
          setEnhancing(false);
          setShowAddModal(false);
          resetForm();
          window.location.reload();
        }
      } else {
        setTimeout(() => {
          setEnhancedData({
            estimated_hours: taskDiff === "Hard" ? 5.0 : taskDiff === "Medium" ? 3.0 : 1.5,
            priority: taskDiff === "Hard" ? "High" : "Medium",
            suggested_start_date: new Date().toISOString().split("T")[0]
          });
          setEnhancing(false);
        }, 1000);
      }
    } catch (e) {
      console.error(e);
      setEnhancing(false);
    }
  };

  // Handle OCR Document extraction (Vision)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
    }
  };

  const handleOcrSubmit = async () => {
    if (!uploadFile) return;
    setOcrLoading(true);

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      if (apiConnected) {
        const res = await fetch("http://localhost:8000/api/tasks/extract", {
          method: "POST",
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          setOcrResult(data);
          // Refresh list automatically
          window.location.reload();
        }
      } else {
        setTimeout(async () => {
          const result = {
            name: "DBMS Mini Project",
            description: "Design relational database schema. Code CREATE TABLE syntax, verify indexes, draft relation documentation.",
            deadline: "2026-06-28",
            estimated_hours: 6.0,
            difficulty: "Hard",
            category: "Academic",
            priority: "High",
            confidence_score: 0.94,
            extraction_summary: "RELATIONAL DATABASE: Code constraints, CREATE commands. Extracted via Vision."
          };
          setOcrResult(result);
          await createTask(result.name, result.description, result.deadline, result.difficulty, result.category);
          setOcrLoading(false);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
      setOcrLoading(false);
    }
  };

  const triggerMockOcrDemo = async () => {
    if (currentStep === 1) {
      setOcrLoading(true);
      setPreviewUrl("/syllabus_mockup.png");
      setTimeout(async () => {
        setOcrLoading(false);
        await nextDemoStep();
      }, 1500);
    }
  };

  const handleCardClick = async (task: Task) => {
    setSelectedTask(task);
    setInsightLoading(true);
    setShowInsightsDrawer(true);
    
    try {
      const insight = await getTaskInsights(task.id);
      setInsightData(insight);
    } catch (e) {
      console.error(e);
    } finally {
      setInsightLoading(false);
    }
  };

  const renderTaskCard = (task: Task) => {
    const isCritical = task.priority === "Critical" || task.priority_score >= 90;
    const isHigh = task.priority === "High";
    const isHighRisk = task.risk_level === "High";

    return (
      <div 
        key={task.id} 
        onClick={() => handleCardClick(task)}
        className={`glass-card p-4 rounded-xl space-y-3 relative overflow-hidden transition-all border cursor-pointer hover:border-violet-500/40 hover:scale-[1.01] ${
          isHighRisk ? "border-rose-500/20 shadow-lg shadow-rose-950/5" : "border-slate-800/80"
        }`}
      >
        {/* Floating Priority Badge */}
        {task.priority_score > 0 && (
          <div className="absolute top-3 right-3 flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full flex flex-col items-center justify-center border font-black text-xs ${
              isCritical 
                ? "bg-rose-500/10 text-rose-400 border-rose-500/30 glow-text-danger" 
                : isHigh 
                ? "bg-violet-500/10 text-violet-400 border-violet-500/30 glow-text-primary" 
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`} title="AI Priority Score">
              {Math.round(task.priority_score)}
            </div>
          </div>
        )}

        {/* Task category / title */}
        <div className="space-y-1 pr-8">
          <span className="text-[9px] uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-extrabold tracking-wider">
            {task.category}
          </span>
          <h4 className="font-bold text-white text-sm tracking-tight leading-tight mt-1">
            {task.name}
          </h4>
        </div>

        {/* Confidence Badge for Vision OCR tasks */}
        {task.confidence_score !== undefined && task.confidence_score < 1.0 && (
          <div className="inline-flex items-center space-x-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <span>OCR Confidence: {Math.round(task.confidence_score * 100)}%</span>
          </div>
        )}

        {/* Short details */}
        {task.description && (
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Meta detail badges */}
        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-900/60 font-medium">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Due: {task.deadline}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Effort: {task.estimated_hours}h</span>
          </div>
        </div>

        {/* AI Prioritization Explanation Reasoning Bubble */}
        {task.reasoning && (
          <div className="text-[10px] text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/50 leading-relaxed flex items-start gap-1.5">
            <Brain className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <span>{task.reasoning}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-between items-center pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => deleteTask(task.id)}
            className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex gap-1">
            {task.status === "Pending" && (
              <button
                onClick={() => updateTaskStatus(task.id, "In Progress")}
                className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                Start Work
              </button>
            )}
            {task.status === "In Progress" && (
              <button
                onClick={() => updateTaskStatus(task.id, "Completed")}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle className="w-3 h-3" />
                Complete
              </button>
            )}
          </div>
        </div>

        {/* Danger glow borders */}
        {isHighRisk && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300 relative">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Tasks Board</h2>
          <p className="text-sm text-slate-400 mt-1">
            Organize work items, extract syllabus dates, and let AI prioritize.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg shadow-violet-600/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Task Manually
          </button>
        </div>
      </div>

      {/* Feature 2: Deadline Extraction screenshot zone */}
      <div className="glass-card-no-hover p-6 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 text-violet-400" />
          AI Deadline Extractor (Vision OCR)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="relative border-2 border-dashed border-slate-800/80 hover:border-violet-500/40 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/20 transition-all">
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            <div className="p-3 bg-violet-600/10 rounded-xl text-violet-400 border border-violet-500/10">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Upload assignment screenshot or PDF</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Supports JPG, PNG, PDF up to 5MB</p>
            </div>
          </div>

          <div className="bg-slate-950/30 border border-slate-800/60 p-4 rounded-xl min-h-[148px] flex flex-col items-center justify-center text-center relative">
            {ocrLoading && (
              <div className="space-y-2">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-[10px] text-slate-400 font-semibold block">Gemini OCR running...</span>
              </div>
            )}

            {!ocrLoading && !previewUrl && !ocrResult && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 font-medium">No document selected</p>
                {currentStep === 1 && (
                  <button
                    onClick={triggerMockOcrDemo}
                    className="px-4 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Simulate OCR Upload (DBMS Project)
                  </button>
                )}
              </div>
            )}

            {previewUrl && !ocrLoading && (
              <div className="w-full flex items-center space-x-4">
                <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  <FileImage className="w-8 h-8 text-violet-400" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold block truncate">{uploadFile?.name || "syllabus_mockup.png"}</span>
                  <span className="text-[9px] text-slate-500 uppercase font-extrabold tracking-wide block">Ready to parse</span>
                  <button
                    onClick={handleOcrSubmit}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white flex items-center gap-1 cursor-pointer"
                  >
                    Run Extractor
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {ocrResult && !ocrLoading && (
              <div className="text-left w-full space-y-2 animate-in fade-in-0">
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-extrabold">
                  <CheckCircle className="w-4 h-4" />
                  <span>EXTRACT SUCCESSFUL</span>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider ml-auto">
                    {Math.round(ocrResult.confidence_score * 100)}% Confidence
                  </span>
                </div>
                <div className="space-y-1.5 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <h4 className="text-xs font-bold text-white truncate">{ocrResult.name}</h4>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {ocrResult.extraction_summary || ocrResult.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Column 1 - Pending */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-1">
            <h3 className="font-extrabold text-white text-sm tracking-wider uppercase flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500"></span>
              <span>Pending</span>
            </h3>
            <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
              {pendingTasks.length}
            </span>
          </div>

          <div className="space-y-4 min-h-[300px] p-2 bg-slate-950/20 border border-slate-900/50 rounded-2xl">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs font-medium">No pending tasks</div>
            ) : (
              pendingTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* Column 2 - In Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-1">
            <h3 className="font-extrabold text-white text-sm tracking-wider uppercase flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>In Progress</span>
            </h3>
            <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
              {progressTasks.length}
            </span>
          </div>

          <div className="space-y-4 min-h-[300px] p-2 bg-slate-950/20 border border-slate-900/50 rounded-2xl">
            {progressTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs font-medium">No active tasks</div>
            ) : (
              progressTasks.map(renderTaskCard)
            )}
          </div>
        </div>

        {/* Column 3 - Completed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-1">
            <h3 className="font-extrabold text-white text-sm tracking-wider uppercase flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Completed</span>
            </h3>
            <span className="text-xs font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-4 min-h-[300px] p-2 bg-slate-950/20 border border-slate-900/50 rounded-2xl">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs font-medium">No completed tasks</div>
            ) : (
              completedTasks.map(renderTaskCard)
            )}
          </div>
        </div>

      </div>

      {/* Feature 7: Assignment Insights Sliding Drawer */}
      {showInsightsDrawer && selectedTask && (
        <div className="fixed inset-y-0 right-0 z-40 w-96 bg-slate-950 border-l border-slate-800/80 shadow-2xl p-6 flex flex-col space-y-6 animate-in slide-in-from-right duration-300">
          
          {/* Drawer Header */}
          <div className="flex justify-between items-start shrink-0">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded-md text-violet-400 font-extrabold tracking-widest">
                AI Breakdown
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                {selectedTask.name}
              </h3>
            </div>
            <button 
              onClick={() => setShowInsightsDrawer(false)}
              className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {insightLoading ? (
              <div className="py-24 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-xs text-slate-400 block font-semibold">Gemini organizing milestones...</span>
              </div>
            ) : insightData ? (
              <div className="space-y-6">
                
                {/* Summary section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-violet-400" />
                    Simple Summary
                  </h4>
                  <p className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-900/60 leading-relaxed font-medium">
                    {insightData.simple_summary}
                  </p>
                </div>

                {/* Effort section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-violet-400" />
                    Effort Estimation
                  </h4>
                  <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-900/60 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Total hours required:</span>
                    <strong className="text-white font-extrabold">{insightData.estimated_effort_hours} Hours</strong>
                  </div>
                </div>

                {/* Milestones execution plan checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-violet-400" />
                    Milestones Roadmap Plan
                  </h4>
                  
                  <div className="space-y-3">
                    {JSON.parse(insightData.milestones).map((ms: any, index: number) => (
                      <div key={index} className="p-3 bg-slate-900/20 border border-slate-900 rounded-xl flex items-start space-x-3">
                        <div className="p-1 rounded bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-black shrink-0">
                          M{index+1}
                        </div>
                        <div className="space-y-1 text-left">
                          <h5 className="text-xs font-extrabold text-white leading-normal">
                            {ms.milestone}
                          </h5>
                          <p className="text-[11px] text-slate-400 leading-normal">
                            {ms.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-xs text-slate-500">
                Could not retrieve assignment insights breakdown.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Manual Task Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card-no-hover max-w-md w-full p-6 rounded-2xl border border-slate-800 bg-[#0c101d] space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-violet-400" />
              Add Task Manually
            </h3>
            
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DBMS Assignment"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">Description (Optional)</label>
                <textarea
                  placeholder="Detail instructions here"
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 block">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 block">Difficulty</label>
                  <select
                    value={taskDiff}
                    onChange={(e) => setTaskDiff(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Academic, Career, Personal"
                  value={taskCat}
                  onChange={(e) => setTaskCat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              {enhancedData && (
                <div className="p-3 bg-violet-600/10 border border-violet-500/20 rounded-xl space-y-1 animate-in fade-in-0 duration-300">
                  <span className="text-[9px] uppercase font-extrabold tracking-widest text-violet-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Gemini Predictions
                  </span>
                  <div className="text-xs text-slate-300 flex justify-between">
                    <span>Est. Hours: <strong>{enhancedData.estimated_hours}h</strong></span>
                    <span>Priority: <strong>{enhancedData.priority}</strong></span>
                    <span>Start: <strong>{enhancedData.suggested_start_date}</strong></span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/30 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleAiEnhance}
                  disabled={enhancing || !taskName || !taskDeadline}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-600/15 hover:bg-violet-600/25 text-xs font-bold text-violet-400 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {enhancing ? "Thinking..." : "AI Enhance"}
                  <Sparkles className="w-3.5 h-3.5" />
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white cursor-pointer disabled:opacity-50"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
