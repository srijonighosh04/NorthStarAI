"use client";

import React, { useState, useEffect } from "react";
import { useDemo } from "../context/DemoContext";
import { 
  Play, 
  Pause, 
  X, 
  CheckCircle, 
  Sparkles, 
  BrainCircuit, 
  HelpCircle,
  Clock
} from "lucide-react";

export const FocusOverlay: React.FC = () => {
  const { 
    showFocusOverlay, 
    closeFocusOverlay, 
    tasks, 
    activeTaskId, 
    focusTimer, 
    isFocusRunning, 
    pauseFocusMode, 
    startFocusMode, 
    stopFocusMode 
  } = useDemo();

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Trigger check-in dialog 8 seconds after entering focus mode to simulate AI checking in
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showFocusOverlay && isFocusRunning && !showCheckIn && !showSubtasks) {
      timeout = setTimeout(() => {
        setShowCheckIn(true);
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [showFocusOverlay, isFocusRunning, showCheckIn, showSubtasks]);

  if (!showFocusOverlay || !activeTask) return null;

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const handleHelpStuck = () => {
    setShowCheckIn(false);
    // Generate AI micro tasks
    setSubtasks([
      "Draft Entity-Relationship Diagram (ERD) mapping Users, Tasks, and Schedule",
      "Write SQL schemas (CREATE TABLE commands with foreign keys)",
      "Set up local connection endpoints in SQLite backend"
    ]);
    setShowSubtasks(true);
  };

  return (
    <div className="fixed inset-0 z-45 bg-[#030610]/95 backdrop-blur-md flex items-center justify-center p-6 transition-all duration-300">
      {/* Top Close Button */}
      <button 
        onClick={closeFocusOverlay}
        className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8">
        
        {/* Active Task Banner */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-400 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Focus Session Active</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            {activeTask.name}
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            {activeTask.description || "Get comfortable and minimize distractions."}
          </p>
        </div>

        {/* Pulsing Timer Circle */}
        <div className="relative w-72 h-72 flex items-center justify-center">
          {/* Animated rings */}
          <div className={`absolute inset-0 rounded-full border-2 border-violet-500/20 transition-all ${isFocusRunning ? "pomodoro-active" : ""}`}></div>
          <div className="absolute inset-4 rounded-full bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
            
            {/* Clock display */}
            <span className="text-5xl font-black text-white tracking-widest font-mono">
              {formatTime(focusTimer)}
            </span>
            
            {/* Sub-label */}
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold mt-1">
              Pomodoro Timer
            </span>
            
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={stopFocusMode}
            className="px-5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition-all cursor-pointer"
          >
            End Session
          </button>

          <button
            onClick={() => isFocusRunning ? pauseFocusMode() : startFocusMode(activeTaskId!)}
            className="p-4 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/30 transition-all transform hover:scale-105 cursor-pointer"
          >
            {isFocusRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>

          <button
            onClick={closeFocusOverlay}
            className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Minimize
          </button>
        </div>

        {/* AI Check-In Overlay Dialog */}
        {showCheckIn && (
          <div className="glass-card-no-hover border border-violet-500/30 max-w-md w-full p-6 rounded-2xl relative shadow-2xl bg-slate-900/90 animate-in fade-in-0 zoom-in-95">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-violet-600/20 rounded-xl border border-violet-500/30 text-violet-400 shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div className="text-left space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                  AI Coach Check-in
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "I noticed you've been working on the **{activeTask.name}** database section. Still going strong, or are you getting stuck on schema structure?"
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCheckIn(false)}
                    className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-[11px] font-bold text-white transition-all cursor-pointer"
                  >
                    Going Strong!
                  </button>
                  <button
                    onClick={handleHelpStuck}
                    className="px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    I'm Stuck. Help!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Breakdown Subtasks display */}
        {showSubtasks && (
          <div className="glass-card-no-hover border border-emerald-500/30 max-w-md w-full p-6 rounded-2xl relative shadow-2xl bg-slate-900/90 animate-in fade-in-0 zoom-in-95">
            <div className="text-left space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="font-bold text-white text-sm">AI Micro-Goal Breakdown</h4>
              </div>
              <p className="text-xs text-slate-300">
                AI Coach suggests focusing on these smaller steps one-by-one:
              </p>
              <div className="space-y-2">
                {subtasks.map((st, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                    <div className="mt-0.5 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <span className="text-xs text-slate-200 leading-normal">{st}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowSubtasks(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all cursor-pointer"
              >
                Let's Do It
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
export default FocusOverlay;
