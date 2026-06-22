"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDemo } from "../context/DemoContext";
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  BarChart3, 
  Compass, 
  Wifi, 
  WifiOff,
  Sparkles
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { apiConnected } = useDemo();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Tasks Board", href: "/tasks", icon: CheckSquare },
    { name: "Calendar Plan", href: "/calendar", icon: Calendar },
    { name: "AI Coach Chat", href: "/coach", icon: MessageSquare },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 glass-card-no-hover border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="p-2 bg-violet-600/20 rounded-lg border border-violet-500/30">
          <Compass className="w-6 h-6 text-violet-400 glow-text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
            NorthStar<span className="text-violet-400 font-extrabold ml-0.5">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            Deadline Guardian
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? "bg-violet-600/15 text-white border-l-4 border-violet-500 font-semibold"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-100"
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-violet-400" : "text-slate-400"}`} />
              <span className="text-sm">{item.name}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-violet-400 rounded-full glow-text-primary"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* API Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {apiConnected ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">Live Agent Backend</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-400">Local Simulation</span>
            </>
          )}
        </div>
        
        <div className="flex items-center">
          <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold tracking-wider ${
            apiConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
          }`}>
            {apiConnected ? "Connected" : "Sim-Mode"}
          </span>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
