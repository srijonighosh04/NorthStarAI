"use client";

import React, { useState } from "react";
import { useDemo } from "../context/DemoContext";
import { 
  Compass, 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, isLoading } = useDemo();
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate manual login using google mock flow for demo purposes
    await loginWithGoogle();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030610] p-6 relative overflow-hidden">
      
      {/* Background neon glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="max-w-md w-full glass-card-no-hover border border-slate-800/80 rounded-3xl p-8 relative z-10 space-y-6 shadow-2xl bg-slate-950/60">
        
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-violet-600/15 rounded-2xl border border-violet-500/30 text-violet-400 glow-text-primary animate-pulse">
            <Compass className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center">
              NorthStar<span className="text-violet-400 font-extrabold ml-0.5">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
              AI-Powered Deadline Guardian
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-900 rounded-xl">
          <button
            onClick={() => setActiveTab("login")}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "login" 
                ? "bg-slate-900 text-white shadow-md border border-slate-800" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab("signup")}
            className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "signup" 
                ? "bg-slate-900 text-white shadow-md border border-slate-800" 
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {activeTab === "signup" && (
            <div className="space-y-1.5 animate-in fade-in-0 duration-200">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Srijoni Ghosh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-900 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500"
                />
                <ShieldCheck className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-900 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500"
              />
              <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              {activeTab === "login" && (
                <a href="#" className="text-[10px] text-violet-400 hover:underline">Forgot password?</a>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-900 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-violet-500"
              />
              <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Remember me trigger for login */}
          {activeTab === "login" && (
            <div className="flex items-center space-x-2 pt-1">
              <input 
                type="checkbox" 
                id="remember"
                className="w-3.5 h-3.5 bg-slate-950 border border-slate-900 rounded focus:ring-0 accent-violet-600 cursor-pointer"
              />
              <label htmlFor="remember" className="text-[11px] text-slate-400 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>
          )}

          {/* Submission CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/10 cursor-pointer transition-all hover:translate-y-[-1px] disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {activeTab === "login" ? "Sign In" : "Register"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Separator lines */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-900"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-600 font-extrabold tracking-wider uppercase">or continue with</span>
          <div className="flex-grow border-t border-slate-900"></div>
        </div>

        {/* Google Sign in Button */}
        <button
          onClick={loginWithGoogle}
          disabled={isLoading}
          className="w-full py-3 rounded-xl bg-slate-950 border border-slate-900 hover:border-slate-800 text-xs font-bold text-white flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:bg-slate-900/50"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              {/* Colorful Google custom G logo */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.645 5.645 0 0 1 8.24 12.9a5.645 5.645 0 0 1 5.751-5.7 5.56 5.56 0 0 1 3.904 1.54l3.141-3.14A9.92 9.92 0 0 0 13.991 3C8.473 3 4 7.473 4 12.991c0 5.518 4.473 9.99 9.991 9.99 5.757 0 9.57-4.043 9.57-9.743 0-.66-.06-1.3-.173-1.953H12.24Z"
                />
              </svg>
              <span>Sign In with Google</span>
            </>
          )}
        </button>

        {/* Footer legal mock details */}
        <div className="text-[10px] text-center text-slate-500">
          Protecting your workflow. Secure sandbox connection.
        </div>

      </div>
    </div>
  );
};
export default LoginScreen;
