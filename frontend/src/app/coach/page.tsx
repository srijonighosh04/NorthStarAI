"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDemo } from "../../context/DemoContext";
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Trash2, 
  Clock, 
  Bot, 
  User,
  Heart,
  CalendarDays,
  Gauge
} from "lucide-react";

export default function CoachPage() {
  const { chatHistory, sendChatMessage, clearChat, isLoading } = useDemo();
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendChatMessage(msg);
  };

  const handleQuickAction = async (msg: string) => {
    if (isLoading) return;
    await sendChatMessage(msg);
  };

  const quickActions = [
    { label: "I'm overwhelmed. Help me prioritize.", text: "I'm feeling overwhelmed by my deadlines. Please suggest what I should focus on.", icon: Heart, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
    { label: "I only have 2 hours today. Replan.", text: "I only have 2 hours tonight. Can you replan my daily schedule?", icon: CalendarDays, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { label: "How should I structure study goals?", text: "Can you help me break down a complex study goal?", icon: Gauge, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }
  ];

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-6 animate-in fade-in-50 duration-300">
      
      {/* Title Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-violet-400 glow-text-primary" />
            AI Coach
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Chat with Gemini for smart scheduling recommendations and stress mitigation.
          </p>
        </div>
        <button
          onClick={clearChat}
          className="p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/20 hover:bg-slate-900/50 text-slate-500 hover:text-rose-400 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Clear Chat History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Conversation
        </button>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Chat Dialog Window (3 cols) */}
        <div className="lg:col-span-3 glass-card-no-hover rounded-2xl flex flex-col h-full overflow-hidden relative">
          
          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                <div className="p-4 bg-violet-600/15 rounded-2xl border border-violet-500/30 text-violet-400">
                  <Bot className="w-8 h-8 glow-text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Start a session with your Coach</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1.5">
                    "Hi! I am Gemini, your productivity strategist. Share if you are feeling overwhelmed, need time breakdowns, or want to fit work into small study blocks."
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {chatHistory.map((msg) => {
                  const isModel = msg.role === "model";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex items-start space-x-3 max-w-[85%] ${
                        isModel ? "mr-auto text-left" : "ml-auto flex-row-reverse space-x-reverse text-left"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`p-2 rounded-xl shrink-0 border ${
                        isModel 
                          ? "bg-violet-600/10 text-violet-400 border-violet-500/20" 
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}>
                        {isModel ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 border ${
                        isModel 
                          ? "bg-slate-900/60 border-slate-800 text-slate-200" 
                          : "bg-violet-600 text-white border-violet-500 font-medium"
                      }`}>
                        <p className="whitespace-pre-line">{msg.message}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-center space-x-3 mr-auto max-w-[85%]">
                    <div className="p-2 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* Form input footer */}
          <div className="p-4 border-t border-slate-900 bg-slate-950/40 shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Ask coach: 'I only have 2 hours tonight'..."
                className="flex-1 px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-5 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </form>
          </div>

        </div>

        {/* Quick Actions Side panel (1 col) */}
        <div className="space-y-4 shrink-0">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Quick Coach Queries
          </h3>
          <div className="space-y-3.5">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.text)}
                  disabled={isLoading}
                  className="w-full text-left p-4 rounded-2xl glass-card border border-slate-850 hover:border-violet-500/40 bg-slate-950/20 hover:bg-slate-900/40 transition-all space-y-2 cursor-pointer flex flex-col group"
                >
                  <div className={`p-2 rounded-xl border shrink-0 w-8 h-8 flex items-center justify-center ${action.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors leading-tight">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
