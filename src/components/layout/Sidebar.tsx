"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  PieChart,
  Clock,
  Users2,
  CheckSquare,
  BotMessageSquare,
  Settings,
  PartyPopper,
  ChevronRight,
} from "lucide-react";
import { useEvent } from "@/context/EventContext";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "My Events", href: "/events", icon: CalendarDays },
  { label: "AI Event Creator", href: "/creator", icon: Sparkles, badge: "AI" },
  { label: "Budget Planner", href: "/budget", icon: PieChart },
  { label: "Timeline", href: "/timeline", icon: Clock },
  { label: "Vendor Manager", href: "/vendors", icon: Users2 },
  { label: "Checklist", href: "/checklist", icon: CheckSquare },
  { label: "AI Assistant", href: "/assistant", icon: BotMessageSquare, badge: "Pro" },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentEvent } = useEvent();

  return (
    <aside className="w-64 bg-[#210D33] text-stone-200 flex flex-col shrink-0 min-h-screen border-r border-[#361548]">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-plum-800/60">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gold-500 via-gold-400 to-amber-200 flex items-center justify-center shadow-goldGlow">
            <PartyPopper className="w-5 h-5 text-plum-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Planora
              </span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 border border-gold-400/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-lavender-200/60 font-light truncate">
              Your Vision. Perfectly Planned.
            </p>
          </div>
        </Link>
      </div>

      {/* Active Event Micro Badge */}
      {currentEvent && (
        <div className="mx-4 my-3 p-3 rounded-xl bg-[#2D1242] border border-plum-700/50">
          <div className="flex items-center justify-between text-[11px] text-gold-400 font-medium mb-1">
            <span className="uppercase tracking-wider">Active Event</span>
            {currentEvent.isDemo && (
              <span className="text-[10px] bg-gold-500/10 text-gold-300 px-1.5 py-0.2 rounded border border-gold-400/20">
                Demo
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-white truncate" title={currentEvent.name}>
            {currentEvent.name}
          </p>
          <p className="text-[11px] text-lavender-200/70 truncate">
            {currentEvent.eventType} • {currentEvent.location}
          </p>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-gradient-to-r from-plum-700 to-plum-800 text-white shadow-md border-l-4 border-gold-400"
                  : "text-lavender-100/75 hover:bg-plum-800/40 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-gold-300" : "text-lavender-300/70"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    item.badge === "AI"
                      ? "bg-gold-500/20 text-gold-300 border border-gold-400/30"
                      : "bg-lavender-300/20 text-lavender-200"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-plum-800/60 bg-[#1A0A28]/80 text-[11px] text-lavender-200/50">
        <div className="flex items-center justify-between">
          <span>Engine: Google GenAI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Engine Active" />
        </div>
        <p className="mt-1 text-[10px] text-lavender-300/40">
          Planora AI v1.0 • India Edition
        </p>
      </div>
    </aside>
  );
}
