"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-12 bg-gray-900 z-30 flex items-center px-3 gap-3 shadow-md">
        <button
          onClick={() => setOpen(true)}
          className="text-white p-2 rounded-md hover:bg-gray-700 transition-colors"
          aria-label="メニューを開く"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-pink-400 font-bold text-base tracking-wide">DAM Viewer</span>
      </header>

      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Main content */}
      <main className="flex-1 min-w-0 p-4 md:p-6 pt-16 md:pt-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
