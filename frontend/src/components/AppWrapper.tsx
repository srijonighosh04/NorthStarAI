"use client";

import React from "react";
import { useDemo } from "../context/DemoContext";
import Sidebar from "./Sidebar";
import DemoController from "./DemoController";
import FocusOverlay from "./FocusOverlay";
import LoginScreen from "./LoginScreen";

export const AppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useDemo();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-row w-full">
      {/* Main Sidebar */}
      <Sidebar />

      {/* Page content scroll frame */}
      <div className="flex-1 min-h-screen ml-64 flex flex-col relative overflow-hidden">
        <main className="flex-1 p-8 pb-24">
          {children}
        </main>
      </div>

      {/* Floating Demo Actions Controller */}
      <DemoController />

      {/* Focus Mode overlay */}
      <FocusOverlay />
    </div>
  );
};
export default AppWrapper;
