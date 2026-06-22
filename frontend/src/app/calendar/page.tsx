"use client";

import React, { useState } from "react";
import { useDemo, ScheduleBlock } from "../../context/DemoContext";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  CalendarCheck,
  CheckCircle
} from "lucide-react";

export default function CalendarPage() {
  const { tasks, schedule, calendarEvents, syncGoogleCalendar, isLoading } = useDemo();
  const [selectedDay, setSelectedDay] = useState<number>(22); // Today June 22
  const [syncing, setSyncing] = useState(false);

  // Month configurations: June 2026
  // June 1, 2026 starts on a Monday
  const monthDaysCount = 30;
  const startDayOffset = 0; // Monday start
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleSyncCalendar = async () => {
    setSyncing(true);
    await syncGoogleCalendar();
    setSyncing(false);
  };

  // Check if a day has deadlines
  const getDeadlinesForDay = (day: number) => {
    const dayStr = `2026-06-${day.toString().padStart(2, "0")}`;
    return tasks.filter(t => t.deadline === dayStr);
  };

  // Generate calendar grid array
  const calendarCells = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= monthDaysCount; d++) {
    calendarCells.push(d);
  }

  // Get active schedule for selected day
  const getScheduleForSelectedDay = (): ScheduleBlock[] => {
    if (selectedDay === 22) {
      return schedule;
    }
    
    // Check if the selected day is a deadline day
    const dayDeadlines = getDeadlinesForDay(selectedDay);
    const dayBlocks: ScheduleBlock[] = [
      {
        id: "sleep-block",
        date: `2026-06-${selectedDay}`,
        start_time: "23:00",
        end_time: "06:00",
        task_id: null,
        task_name: "Sleep Mode (Rest)",
        type: "sleep"
      }
    ];

    // Load mock synced class events for weekdays
    if (selectedDay !== 27 && selectedDay !== 28 && selectedDay !== 21 && selectedDay !== 14) {
      dayBlocks.push({
        id: "class-block",
        date: `2026-06-${selectedDay}`,
        start_time: "09:00",
        end_time: "13:00",
        task_id: null,
        task_name: "DBMS Practical Lecture Class",
        type: "class"
      });
    }

    if (dayDeadlines.length > 0) {
      dayDeadlines.forEach((dl, index) => {
        dayBlocks.push({
          id: `study-${dl.id}-${index}`,
          date: `2026-06-${selectedDay}`,
          start_time: index === 0 ? "15:30" : "17:00",
          end_time: index === 0 ? "17:00" : "18:30",
          task_id: dl.id,
          task_name: `${dl.name} (Milestone Study)`,
          type: "work"
        });
      });
    }

    return dayBlocks.sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const dayBlocks = getScheduleForSelectedDay();

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Calendar Plan</h2>
          <p className="text-sm text-slate-400 mt-1">
            Google Calendar synchronization and intelligent timeblock mapping.
          </p>
        </div>
        <button
          onClick={handleSyncCalendar}
          disabled={syncing || isLoading}
          className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            calendarEvents.length > 0 && !syncing 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
              : "bg-violet-600 hover:bg-violet-500 text-white"
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing || isLoading ? "animate-spin" : ""}`} />
          {syncing || isLoading ? "Syncing..." : calendarEvents.length > 0 ? "Google Calendar Synced" : "Sync Google Calendar"}
        </button>
      </div>

      {/* Main Grid View split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* June 2026 Monthly Grid (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card-no-hover p-6 rounded-2xl space-y-6">
            
            {/* Month Header controls */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-violet-400" />
                <h3 className="font-extrabold text-white text-base">June 2026</h3>
              </div>
              <div className="flex items-center space-x-1.5">
                <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-4">
              {/* Day Titles */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                {weekDays.map((wd) => <div key={wd}>{wd}</div>)}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square rounded-xl bg-transparent"></div>;
                  }

                  const isToday = day === 22;
                  const isSelected = day === selectedDay;
                  const dayDeadlines = getDeadlinesForDay(day);
                  const hasDeadlines = dayDeadlines.length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`aspect-square rounded-xl p-2 flex flex-col justify-between items-start transition-all border text-left cursor-pointer group relative ${
                        isSelected 
                          ? "bg-violet-600/20 border-violet-500 text-white font-extrabold shadow-lg shadow-violet-500/10" 
                          : isToday
                          ? "bg-slate-900 border-slate-700 text-violet-400 font-bold"
                          : "bg-slate-950/40 border-slate-850 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <span className="text-xs">{day}</span>
                      
                      {/* Deadline dots indicators */}
                      {hasDeadlines && (
                        <div className="w-full space-y-0.5 mt-1">
                          {dayDeadlines.map((dl) => (
                            <div 
                              key={dl.id} 
                              className={`text-[8.5px] px-1 py-0.5 rounded truncate font-black uppercase tracking-wide leading-tight ${
                                dl.risk_level === "High" 
                                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" 
                                  : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                              }`}
                              title={dl.name}
                            >
                              {dl.name.slice(0, 5)}...
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Small visual highlight dot for today */}
                      {isToday && !isSelected && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400 glow-text-primary animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Selected Day Details Panel - Right Side (1 col) */}
        <div className="space-y-6 animate-in fade-in-50">
          
          {/* Synced calendar event list widget */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <CalendarCheck className="w-5 h-5 text-violet-400" />
              <span>Synced Calendar Events</span>
            </h3>
            
            <div className="glass-card p-4 rounded-2xl space-y-3">
              {calendarEvents.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-xs text-slate-500 font-medium">No synced Google events loaded.</p>
                  <button 
                    onClick={handleSyncCalendar}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-[10px] font-bold text-white cursor-pointer"
                  >
                    Sync Google Calendar
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-extrabold pb-1.5 border-b border-slate-900/60">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>2 events imported this week</span>
                  </div>
                  {calendarEvents.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-900 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <h5 className="font-bold text-white text-[11px] leading-tight">{ev.summary}</h5>
                        <span className="text-[9.5px] text-slate-500 font-semibold font-mono">{ev.start_time} - {ev.end_time}</span>
                      </div>
                      <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        Google
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-violet-400" />
                <span>Daily Study Schedule</span>
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                June {selectedDay}, 2026
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl space-y-4">
              {dayBlocks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-slate-500">No scheduled blocks for this day.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {dayBlocks.map((block) => {
                    const isClass = block.type === "class";
                    const isSleep = block.type === "sleep";
                    const isWork = block.type === "work";

                    return (
                      <div key={block.id} className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/40 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                            {block.start_time} - {block.end_time}
                          </span>
                          <span className={`text-[8px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full ${
                            isClass 
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                              : isSleep
                              ? "bg-slate-800 text-slate-500"
                              : "bg-violet-500/10 text-violet-400 border border-violet-500/20 glow-text-primary"
                          }`}>
                            {block.type}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-xs leading-normal">
                          {block.task_name}
                        </h4>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="p-3 bg-violet-600/5 border border-violet-500/10 rounded-xl flex items-start space-x-2 text-[10px] text-slate-400 leading-relaxed">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <p>
                  Time slots are optimized based on your sleep, class, and task priority profiles. Deep work slots default to 90-minute blocks.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
