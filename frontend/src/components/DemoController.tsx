"use client";

import React, { useState } from "react";
import { useDemo } from "../context/DemoContext";
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  ListOrdered, 
  CalendarRange, 
  AlertTriangle, 
  MessageSquareCode, 
  Zap,
  HelpCircle,
  Maximize2,
  Minimize2
} from "lucide-react";

export const DemoController: React.FC = () => {
  const { currentStep, nextDemoStep, resetDemoState, isLoading, apiConnected, runFullDemo } = useDemo();
  const [isOpen, setIsOpen] = useState(true);

  const steps = [
    { title: "Initialize Demo State", desc: "Start with 2 default tasks (German and Internship Application).", icon: RotateCcw },
    { title: "Upload Screenshot", desc: "Simulate uploading a DBMS syllabus image. Gemini Vision OCR extracts the details.", icon: FileText },
    { title: "DBMS Task Added", desc: "Task auto-appears on dashboard and boards with predicted hours/priority.", icon: CheckCircle2 },
    { title: "AI Prioritization", desc: "AI ranks all tasks using Urgency, Impact, and Effort index scores.", icon: ListOrdered },
    { title: "Generate Schedule", desc: "Daily planner schedules deep work slots based on preferences.", icon: CalendarRange },
    { title: "Missed Deadline Predictor", desc: "Risk analysis alerts a critical 78% risk level for DBMS project.", icon: AlertTriangle },
    { title: "Coach Replanning", desc: "In chat, request: 'I only have 2 hours today.'", icon: MessageSquareCode },
    { title: "Demo Complete!", desc: "AI replans schedule instantly. Banner shows: 'You are now on track to complete all deadlines!'", icon: Zap },
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? "w-[380px]" : "w-[180px]"}`}>
      <div className="glass-card-no-hover border border-violet-500/30 rounded-2xl overflow-hidden shadow-2xl bg-slate-950/90 shadow-violet-950/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-900/60 to-indigo-900/60 p-4 border-b border-violet-500/20 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" />
            <span className="font-bold text-white text-sm tracking-wide">HACKATHON DEMO</span>
          </div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isOpen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {isOpen ? (
          /* Expanded Panel */
          <div className="p-4 space-y-4">
            <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              Follow this automated workflow to present the core AI features of <strong className="text-violet-300">NorthStarAI</strong> during the live pitch.
            </div>

            {/* Current Step Display */}
            <div className="bg-violet-950/20 border border-violet-500/10 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-violet-400 font-extrabold uppercase tracking-widest">
                  Step {currentStep} of 7
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {apiConnected ? "Running on live API" : "Simulated Mode"}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                {React.createElement(steps[currentStep].icon, { className: "w-4 h-4 text-violet-400" })}
                {steps[currentStep].title}
              </h3>
              <p className="text-xs text-slate-300 leading-normal">
                {steps[currentStep].desc}
              </p>
            </div>

            {/* Steps Progress Checklist */}
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {steps.map((step, idx) => {
                const isCompleted = currentStep > idx;
                const isCurrent = currentStep === idx;
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center space-x-2 text-[11px] p-1.5 rounded-lg transition-colors ${
                      isCurrent ? "bg-violet-500/10 border border-violet-500/20 text-white font-semibold" : "text-slate-400"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      isCompleted ? "bg-violet-600 text-white" : isCurrent ? "border-2 border-violet-400 text-violet-400" : "border border-slate-700"
                    }`}>
                      {isCompleted ? "✓" : idx}
                    </div>
                    <span className="truncate flex-1">{step.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Control Actions */}
            <div className="space-y-2">
              <button
                onClick={runFullDemo}
                disabled={isLoading}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                Run Full Demo (Automated Flow)
              </button>

              <div className="flex gap-2">
                <button
                  onClick={resetDemoState}
                  disabled={isLoading}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 hover:text-white"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                
                {currentStep < 7 ? (
                  <button
                    onClick={nextDemoStep}
                    disabled={isLoading}
                    className="flex-[2] px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {currentStep === 0 ? "Start Demo" : `Step ${currentStep + 1}`}
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex-[2] px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center">
                    Completed!
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Mini Floating State */
          <div className="p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">Demo Step</span>
              <span className="text-xs text-white font-bold">{currentStep} / 7</span>
            </div>
            <button
              onClick={nextDemoStep}
              disabled={isLoading}
              className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default DemoController;
