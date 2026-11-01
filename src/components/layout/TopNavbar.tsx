"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Sparkles,
  ChevronDown,
  PlusCircle,
  Bell,
  Check,
  AlertTriangle,
  Clock,
  PartyPopper,
  CheckCircle2,
} from "lucide-react";
import { useEvent } from "@/context/EventContext";
import { formatDate } from "@/lib/utils";

export function TopNavbar() {
  const { events, currentEvent, currentEventId, switchEvent } = useEvent();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Compute notifications from active event
  const notifications = useMemo(() => {
    if (!currentEvent) return [];

    const items: Array<{
      id: string;
      type: "warning" | "info" | "success";
      title: string;
      desc: string;
      link: string;
    }> = [];

    const now = new Date();

    // 1. Overdue tasks
    const overdueTasks = (currentEvent.tasks || []).filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    );
    if (overdueTasks.length > 0) {
      items.push({
        id: "overdue-tasks",
        type: "warning",
        title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? "s" : ""}`,
        desc: `"${overdueTasks[0].title}" and other items need immediate attention.`,
        link: "/checklist",
      });
    }

    // 2. Upcoming milestones (within next 7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTimelines = (currentEvent.timelineItems || []).filter((tl) => {
      const d = new Date(tl.date);
      return tl.status !== "Completed" && d >= now && d <= sevenDaysFromNow;
    });

    if (upcomingTimelines.length > 0) {
      items.push({
        id: "upcoming-milestones",
        type: "info",
        title: `${upcomingTimelines.length} Milestone${upcomingTimelines.length > 1 ? "s" : ""} Due This Week`,
        desc: `"${upcomingTimelines[0].title}" on ${formatDate(upcomingTimelines[0].date)}.`,
        link: "/timeline",
      });
    }

    // 3. Budget utilization warning
    const totalSpent = (currentEvent.expenses || []).reduce(
      (s, e) => s + (e.actualAmount > 0 ? e.actualAmount : e.estimatedAmount || 0),
      0
    );
    if (currentEvent.budget > 0 && totalSpent > currentEvent.budget) {
      items.push({
        id: "budget-exceeded",
        type: "warning",
        title: "Budget Cap Exceeded",
        desc: `Planned spend exceeds allocated budget by ₹${(totalSpent - currentEvent.budget).toLocaleString("en-IN")}.`,
        link: "/budget",
      });
    }

    return items;
  }, [currentEvent]);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Brand & Event Selector */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <Link href="/" className="flex md:hidden items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-gold-500 to-amber-200 flex items-center justify-center shadow-sm">
            <PartyPopper className="w-4 h-4 text-plum-900" />
          </div>
          <span className="font-serif font-bold text-base text-plum-900">Planora</span>
        </Link>

        {/* Current Event Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-ivory-warm border border-stone-200 hover:border-plum-300 transition-all text-left group"
          >
            <div className="w-7 h-7 rounded-lg bg-plum-100 text-plum-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0 pr-1">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-stone-500">
                Active Event
              </p>
              <p className="text-xs font-bold text-stone-900 truncate max-w-[160px] sm:max-w-[260px]">
                {currentEvent ? currentEvent.name : "Select an Event"}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-cardHover border border-stone-200 z-50 py-2 animate-in fade-in-50 zoom-in-95">
                <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                  <span>Switch Event ({events.length})</span>
                  <Link
                    href="/creator"
                    onClick={() => setDropdownOpen(false)}
                    className="text-plum-700 hover:text-plum-900 font-semibold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    New
                  </Link>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {events.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-stone-500 text-center">
                      No events found.
                    </p>
                  ) : (
                    events.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => {
                          switchEvent(evt.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-plum-50/60 transition-colors ${
                          evt.id === currentEventId ? "bg-plum-50/80 font-medium" : ""
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {evt.name}
                            </p>
                            {evt.isDemo && (
                              <span className="text-[9px] bg-gold-100 text-gold-700 px-1.5 py-0.2 rounded font-semibold border border-gold-200">
                                DEMO
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500 truncate">
                            {evt.eventType} • {evt.location}
                          </p>
                        </div>
                        {evt.id === currentEventId && (
                          <Check className="w-4 h-4 text-plum-700 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* AI Engine Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Engine Ready</span>
        </div>

        {/* Notifications Button & Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-stone-600 hover:text-plum-900 hover:bg-stone-100 transition-colors"
            title="Notifications & Upcoming Deadlines"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-cardHover border border-stone-200 z-50 py-3 animate-in fade-in-50 zoom-in-95">
                <div className="px-4 pb-2 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800">
                    Notifications ({notifications.length})
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Active Event Alerts
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="font-semibold text-stone-700">All caught up!</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">
                        No overdue tasks or urgent deadlines.
                      </p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => setNotificationsOpen(false)}
                        className="p-3.5 hover:bg-stone-50 transition-colors block text-left"
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                              n.type === "warning"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-plum-100 text-plum-700"
                            }`}
                          >
                            {n.type === "warning" ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 leading-snug">
                              {n.title}
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed line-clamp-2">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Create Event CTA */}
        <Link
          href="/creator"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-plum text-white hover:bg-plum-800 shadow-sm transition-all text-xs font-semibold hover:shadow-md hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-300" />
          <span className="hidden sm:inline">Create Event</span>
          <span className="sm:hidden">New</span>
        </Link>

        {/* User Profile Badge */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 pl-2 border-l border-stone-200 hover:opacity-85 transition-opacity"
          title="Onboarding & Settings"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-plum-700 to-plum-900 text-gold-300 flex items-center justify-center font-bold text-xs shadow-sm">
            A
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-bold text-stone-800 leading-none">
              Aarav Sharma
            </p>
            <span className="text-[10px] text-stone-500 font-medium">
              Demo Planner
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
}
