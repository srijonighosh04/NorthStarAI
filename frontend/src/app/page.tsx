"use client";

import React, { useState, useEffect } from "react";
import { useDemo } from "../context/DemoContext";
import { 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Flame, 
  TrendingUp, 
  Award,
  Sparkles,
  BookOpen,
  Plus,
  CalendarRange,
  Zap,
  CalendarDays,
  Activity
} from "lucide-react";

export default function DashboardPage() {
  const { 
    tasks, 
    schedule, 
    currentStep, 
    startFocusMode, 
    northStarScore,
    burnoutInfo,
    fetchProductivityData,
    apiConnected
  } = useDemo();

  const [newGoal, setNewGoal] = useState("");
  const [goalBreakdown, setGoalBreakdown] = useState<any>(null);
  const [goalLoading, setGoalLoading] = useState(false);

  // Derive counts
  const activeTasks = tasks.filter(t => t.status !== "Completed");
  const completedTasks = tasks.filter(t => t.status === "Completed");
  const highRiskTasks = tasks.filter(t => t.risk_level === "High" && t.status !== "Completed");

  // Fetch live productivity score updates on mount and task updates
  useEffect(() => {
    fetchProductivityData();
  }, [tasks, schedule]);

  const handleGoalBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal) return;
    setGoalLoading(true);

    try {
      if (apiConnected) {
        const res = await fetch("http://localhost:8000/api/goals/breakdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal: newGoal })
        });
        if (res.ok) {
          const data = await res.json();
          setGoalBreakdown(data);
        }
      } else {
        setTimeout(() => {
          setGoalBreakdown({
            goal: newGoal,
            weeks: [
              { week: 1, title: "Foundations & Basics", description: `Learn core definitions, terminology, and baseline setup for: ${newGoal}.` },
              { week: 2, title: "Core Application Practice", description: "Design a simple practice project and learn primary workflows." },
              { week: 3, title: "Intermediate Workflows", description: "Implement advanced features, study complex parameters, and debug." },
              { week: 4, title: "Review & Showcase", description: "Review progress, finalize a repository or portfolio piece, and self-assess." }
            ]
          });
        }, 1200);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGoalLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      
      {/* Top Welcome Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Guardian Workspace
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Proactive schedule optimization and deadline guard.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 tracking-wide block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[10px] uppercase bg-violet-600/10 border border-violet-500/20 px-2 py-0.5 rounded-md text-violet-400 font-bold mt-1 inline-block">
            Gemini 2.5 Active
          </span>
        </div>
      </div>

      {/* Feature 8: Workload Burnout Warning Card */}
      {burnoutInfo.is_burned_out && (
        <div className="p-5 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-start space-x-4 animate-in slide-in-from-top-4 duration-300 glow-warning">
          <div className="p-3 bg-rose-600/20 rounded-xl border border-rose-500/30 text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm tracking-wide">⚠️ Burnout Alert: Overloaded Capacity</h4>
            <p className="text-xs text-rose-200 leading-normal">
              {burnoutInfo.warning_message}
            </p>
            <div className="text-[11px] text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-900 leading-relaxed">
              <strong className="text-violet-300">Mitigation Strategy:</strong> {burnoutInfo.mitigation_advice}
            </div>
          </div>
        </div>
      )}

      {/* Demo Alerts overlay */}
      {currentStep === 5 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-4 animate-in slide-in-from-top-4 duration-300 glow-warning">
          <div className="p-2.5 bg-rose-600/20 rounded-xl border border-rose-500/30 text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">⚠️ High Deadline Risk Detected</h4>
            <p className="text-xs text-rose-200 mt-1 leading-relaxed">
              <strong>DBMS Mini Project</strong> has a <strong>78% risk of delay</strong>. Gemini predicts you do not have enough study hours scheduled before the deadline. Speak to your AI Coach or use the demo panel to optimize your schedule.
            </p>
          </div>
        </div>
      )}

      {currentStep >= 7 && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start space-x-4 animate-in slide-in-from-top-4 duration-300 glow-success">
          <div className="p-2.5 bg-emerald-600/20 rounded-xl border border-emerald-500/30 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">🎉 Schedule Replanned Successfully</h4>
            <p className="text-xs text-emerald-200 mt-1 leading-relaxed">
              <strong>You are now on track to complete all deadlines.</strong> Evening slots have been re-arranged (1.5 hours to DBMS and 30 mins to German) to accommodate your time limit while keeping tasks moving.
            </p>
          </div>
        </div>
      )}

      {/* Main KPI Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* KPI 1 */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Tasks</span>
            <div className="p-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{activeTasks.length}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Pending submission</p>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">High Risk Tasks</span>
            <div className={`p-2 rounded-xl ${
              highRiskTasks.length > 0 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-slate-800 text-slate-500"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className={`text-3xl font-black ${highRiskTasks.length > 0 ? "text-rose-400 glow-text-danger" : "text-white"}`}>
              {highRiskTasks.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Needs prioritization</p>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completed Tasks</span>
            <div className="p-2 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white">{completedTasks.length}</h3>
            <p className="text-[11px] text-slate-400 mt-1">Tasks finalized this week</p>
          </div>
        </div>

        {/* KPI 4 - Real NorthStar Score */}
        <div className="glass-card p-5 rounded-2xl space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">NorthStar Score</span>
            <div className="p-2 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-white glow-text-primary">
              {northStarScore.score}<span className="text-xs text-slate-500 font-bold">/100</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 truncate" title={northStarScore.explanation}>
              {northStarScore.explanation}
            </p>
          </div>
        </div>

      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Today's Schedule - Left Side (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-violet-400" />
              <span>Today's Daily Schedule</span>
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {schedule.length} block{schedule.length !== 1 ? "s" : ""} scheduled
            </span>
          </div>

          <div className="glass-card-no-hover p-6 rounded-2xl relative timeline-line">
            {schedule.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <CalendarRange className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-sm text-slate-400">No work blocks scheduled for today yet.</p>
                <div className="text-xs text-slate-500">Run Step 4 on the demo panel to map study slots.</div>
              </div>
            ) : (
              <div className="space-y-6 relative z-10 pl-6">
                {schedule.map((block) => {
                  const hasTask = block.task_id !== null;
                  const isClass = block.type === "class";
                  const isMeeting = block.type === "meeting";
                  const isSleep = block.type === "sleep";

                  return (
                    <div key={block.id} className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-950/40 hover:border-slate-800 transition-all">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[30px] top-6 w-3 h-3 rounded-full border-2 ${
                        isClass ? "bg-blue-400 border-blue-900" : isMeeting ? "bg-amber-400 border-amber-900" : "bg-violet-400 border-violet-900 glow-text-primary"
                      }`}></div>

                      {/* Time blocks and label */}
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 tracking-wide font-mono">
                          {block.start_time} - {block.end_time}
                        </span>
                        <h4 className="font-bold text-white text-sm">
                          {block.task_name}
                        </h4>
                      </div>

                      {/* Right-aligned tags and focus mode trigger */}
                      <div className="flex items-center space-x-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          isClass 
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                            : isMeeting 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                        }`}>
                          {block.type}
                        </span>

                        {hasTask && (
                          <button
                            onClick={() => startFocusMode(block.task_id!)}
                            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md shadow-violet-600/10 transition-all cursor-pointer hover:shadow-violet-600/20"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Focus Mode
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Widgets - Right Side (1 col) */}
        <div className="space-y-6">
          
          {/* Missed Deadline Risk prediction panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-violet-400" />
              <span>AI Risk Predictor</span>
            </h3>

            <div className="glass-card p-5 rounded-2xl space-y-4">
              {tasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500">No active tasks to analyze.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const isHigh = task.risk_level === "High";
                    const isMedium = task.risk_level === "Medium";
                    
                    return (
                      <div key={task.id} className="space-y-2.5 p-3.5 rounded-xl border border-slate-900 bg-slate-950/20 relative">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white truncate max-w-[130px]">
                            {task.name}
                          </span>
                          <span className={`text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full ${
                            isHigh 
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" 
                              : isMedium
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {task.risk_level} Risk
                          </span>
                        </div>
                        
                        {/* Progress slider showing probability */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                            <span>Chance of missing:</span>
                            <span className={isHigh ? "text-rose-400" : isMedium ? "text-amber-400" : "text-emerald-400"}>
                              {task.risk_percentage}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                isHigh ? "bg-rose-500" : isMedium ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${task.risk_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {task.risk_reason && (
                          <p className="text-[10px] text-slate-400 leading-normal border-t border-slate-900/60 pt-1.5">
                            {task.risk_reason}
                          </p>
                        )}
                        
                        {task.recommended_action && (
                          <div className="text-[9px] text-violet-300 leading-normal bg-violet-950/15 border border-violet-500/10 p-2 rounded-lg mt-1 flex items-start gap-1">
                            <Activity className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Action:</strong> {task.recommended_action}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Goal Breakdown Widget */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Flame className="w-5 h-5 text-violet-400" />
              <span>Goal Breakdown</span>
            </h3>

            <div className="glass-card p-5 rounded-2xl space-y-4">
              <form onSubmit={handleGoalBreakdown} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Learn German A1"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={goalLoading}
                  className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>

              {goalLoading && (
                <div className="text-center py-4 space-y-2">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <span className="text-[10px] text-slate-400 block font-medium">Deconstructing goal...</span>
                </div>
              )}

              {goalBreakdown && !goalLoading && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    Syllabus: {goalBreakdown.goal}
                  </h4>
                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {goalBreakdown.weeks.map((week: any) => (
                      <div key={week.week} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 text-left space-y-1">
                        <span className="text-[9px] uppercase font-extrabold tracking-widest text-violet-400">
                          Week {week.week}
                        </span>
                        <h5 className="text-xs font-bold text-white leading-normal">
                          {week.title}
                        </h5>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {week.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
