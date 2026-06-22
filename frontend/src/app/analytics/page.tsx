"use client";

import React from "react";
import { useDemo } from "../../context/DemoContext";
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  AlertOctagon,
  CalendarRange,
  Zap,
  HelpCircle
} from "lucide-react";

export default function AnalyticsPage() {
  const { tasks, currentStep } = useDemo();

  // Stats matching the user specifications
  // "Tasks Completed: 14, Tasks Delayed: 2, Productivity Score: 82/100, Most Productive Day: Wednesday"
  const totalCompleted = 14 + tasks.filter(t => t.status === "Completed").length;
  const totalDelayed = 2;
  const baseProductivity = currentStep >= 7 ? 95 : 82;

  // 1. Weekly Productivity data (Mon-Sun)
  // Wednesday is the peak ("Wednesday" is most productive)
  const weeklyData = [
    { day: "Mon", score: 65 },
    { day: "Tue", score: 78 },
    { day: "Wed", score: 96, isPeak: true }, // Wednesday Peak!
    { day: "Thu", score: 72 },
    { day: "Fri", score: 85 },
    { day: "Sat", score: 50 },
    { day: "Sun", score: 62 },
  ];

  // 2. Risk Trends (historical weekly risks)
  const riskTrend = [
    { week: "Wk 1", risk: 25 },
    { week: "Wk 2", risk: 45 },
    { week: "Wk 3", risk: 65 },
    { week: "Wk 4", risk: 78 }, // DBMS risk peak
    { week: "Current", risk: currentStep >= 7 ? 15 : 78 }, // Risk drops on replan!
  ];

  // SVG dimensions for charts
  const barChartWidth = 500;
  const barChartHeight = 200;
  const lineChartWidth = 500;
  const lineChartHeight = 200;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      
      {/* Title Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Productivity Reports</h2>
        <p className="text-sm text-slate-400 mt-1">
          Review work habits, deadline adherence rates, and risk indices over time.
        </p>
      </div>

      {/* Top stats panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tasks Completed</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{totalCompleted}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">88% completion efficiency</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3.5 bg-rose-600/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tasks Delayed</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{totalDelayed}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Minimal penalty impact</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3.5 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Productivity Score</span>
            <h3 className="text-2xl font-black text-white mt-0.5">{baseProductivity}<span className="text-xs text-slate-500">/100</span></h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Peak Output: Wednesday</p>
          </div>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1 - Weekly Productivity (Bar Chart) */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4.5 h-4.5 text-violet-400" />
            Weekly Performance Output
          </h3>
          
          <div className="relative pt-4 flex justify-center">
            {/* SVG Bar Chart */}
            <svg viewBox={`0 0 ${barChartWidth} ${barChartHeight}`} className="w-full h-auto max-h-[220px]">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 20 + ratio * 140;
                return (
                  <line 
                    key={idx}
                    x1="40" 
                    y1={y} 
                    x2={barChartWidth - 20} 
                    y2={y} 
                    stroke="rgba(255, 255, 255, 0.05)" 
                    strokeWidth="1"
                  />
                );
              })}

              {/* Draw Bars */}
              {weeklyData.map((d, idx) => {
                const spacing = (barChartWidth - 80) / weeklyData.length;
                const x = 50 + idx * spacing;
                const barHeight = (d.score / 100) * 140;
                const y = 160 - barHeight;
                const barWidth = 30;

                return (
                  <g key={d.day} className="group cursor-pointer">
                    {/* Shadow / glow behind peak bar */}
                    {d.isPeak && (
                      <rect 
                        x={x} 
                        y={y} 
                        width={barWidth} 
                        height={barHeight} 
                        rx="6" 
                        fill="rgba(139, 92, 246, 0.2)"
                        filter="blur(8px)"
                      />
                    )}

                    {/* Main Bar */}
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="6" 
                      fill={d.isPeak ? "url(#peakGrad)" : "url(#normGrad)"}
                      className="transition-all duration-300 hover:opacity-90"
                    />

                    {/* Label below bar */}
                    <text 
                      x={x + barWidth / 2} 
                      y="185" 
                      textAnchor="middle" 
                      fill="#94a3b8" 
                      className="text-[10px] font-bold"
                    >
                      {d.day}
                    </text>

                    {/* Value above bar */}
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 8} 
                      textAnchor="middle" 
                      fill={d.isPeak ? "#c084fc" : "#fff"} 
                      className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {d.score}%
                    </text>
                  </g>
                );
              })}

              {/* Definitions for gradients */}
              <defs>
                <linearGradient id="peakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
                <linearGradient id="normGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-2">
            <span>Score calculated from schedules completed</span>
            <span className="text-violet-400">Peak Performance Wednesday</span>
          </div>
        </div>

        {/* Chart 2 - Risk Trends (Line Chart) */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4.5 h-4.5 text-violet-400" />
            Active Deadline Risk Trends
          </h3>

          <div className="relative pt-4 flex justify-center">
            {/* SVG Line Chart */}
            <svg viewBox={`0 0 ${lineChartWidth} ${lineChartHeight}`} className="w-full h-auto max-h-[220px]">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 20 + ratio * 140;
                return (
                  <line 
                    key={idx}
                    x1="40" 
                    y1={y} 
                    x2={lineChartWidth - 20} 
                    y2={y} 
                    stroke="rgba(255, 255, 255, 0.05)" 
                    strokeWidth="1"
                  />
                );
              })}

              {/* Generate Line Path */}
              {(() => {
                const spacing = (lineChartWidth - 80) / (riskTrend.length - 1);
                const points = riskTrend.map((d, idx) => {
                  const x = 50 + idx * spacing;
                  const y = 160 - (d.risk / 100) * 140;
                  return { x, y };
                });

                const pathD = points.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, "");

                // Area under line path
                const areaD = `${pathD} L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;

                return (
                  <>
                    {/* Area fill */}
                    <path d={areaD} fill="url(#areaGrad)" />

                    {/* Main stroke line */}
                    <path 
                      d={pathD} 
                      fill="none" 
                      stroke="#8b5cf6" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="glow-text-primary"
                    />

                    {/* Nodes points */}
                    {points.map((p, idx) => (
                      <g key={idx} className="group cursor-pointer">
                        <circle 
                          cx={p.x} 
                          cy={p.y} 
                          r="5.5" 
                          fill="#8b5cf6" 
                          stroke="#fff" 
                          strokeWidth="2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 12}
                          textAnchor="middle"
                          fill="#c084fc"
                          className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {riskTrend[idx].risk}%
                        </text>
                        <text
                          x={p.x}
                          y="185"
                          textAnchor="middle"
                          fill="#94a3b8"
                          className="text-[10px] font-bold"
                        >
                          {riskTrend[idx].week}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* Definitions for line gradients */}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold px-2">
            <span>Overall risk index trend</span>
            <span className={currentStep >= 7 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
              {currentStep >= 7 ? "Risk Reduced to 15%" : "Risk Elevated at 78%"}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
