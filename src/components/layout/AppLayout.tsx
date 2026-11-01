"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";
import { EventProvider } from "@/context/EventContext";
import { ToastProvider } from "@/context/ToastContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <EventProvider>
        <div className="min-h-screen flex bg-[#FAF9F5] text-stone-900 font-sans antialiased selection:bg-gold-200 selection:text-plum-900">
          {/* Main Sidebar */}
          <Sidebar />

          {/* Right Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopNavbar />
            <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </EventProvider>
    </ToastProvider>
  );
}
