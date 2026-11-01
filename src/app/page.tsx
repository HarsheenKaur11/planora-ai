"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Bookmark,
  Loader2,
  Activity,
  Building2,
} from "lucide-react";
import { useEvent } from "@/context/EventContext";
import { formatCurrency, formatDate, formatRelativeDays } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const {
    events,
    currentEvent,
    isLoading,
    currency,
    switchEvent,
    toggleBookmarkIdea,
    refreshCurrentEvent,
  } = useEvent();

  const [selectedIdeaCategory, setSelectedIdeaCategory] = useState("All");
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  // Handle generating new AI ideas
  const handleGenerateMoreIdeas = async () => {
    if (!currentEvent) return;
    try {
      setIsGeneratingIdeas(true);
      const res = await fetch("/api/ai/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: currentEvent.id,
          category: selectedIdeaCategory !== "All" ? selectedIdeaCategory : undefined,
        }),
      });
      if (res.ok) {
        await refreshCurrentEvent();
      }
    } catch (err) {
      console.error("Failed to generate ideas", err);
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  // Aggregate stats across all events
  const totalEvents = events.length;
  const totalBudget = events.reduce((sum, e) => sum + e.budget, 0);
  const totalSpent = events.reduce((sum, e) => sum + e.totalSpent, 0);
  const totalPendingTasks = events.reduce(
    (sum, e) => sum + (e.totalTasks - e.completedTasks),
    0
  );

  // Active event specific metrics
  const activeBudget = currentEvent?.budget || 0;
  const activeExpenses = currentEvent?.expenses || [];
  const activeSpent = activeExpenses.reduce(
    (sum, e) => sum + (e.actualAmount || e.estimatedAmount || 0),
    0
  );
  const activeRemaining = activeBudget - activeSpent;
  const activeUtilization = activeBudget > 0 ? Math.min(100, Math.round((activeSpent / activeBudget) * 100)) : 0;

  const activeTasks = currentEvent?.tasks || [];
  const completedTasks = activeTasks.filter((t) => t.completed).length;
  const taskProgress = activeTasks.length > 0 ? Math.round((completedTasks / activeTasks.length) * 100) : 0;

  const activeVendors = currentEvent?.vendors || [];
  const bookedVendors = activeVendors.filter((v) => v.bookingStatus === "Booked").length;

  const upcomingTimelines = (currentEvent?.timelineItems || [])
    .filter((t) => t.status !== "Completed")
    .slice(0, 4);

  // Recent activity stream across logged expenses, booked vendors, and completed tasks
  const recentActivities = useMemo(() => {
    if (!currentEvent) return [];
    const activities: {
      id: string;
      type: "expense" | "task" | "vendor";
      title: string;
      subtitle: string;
      time: string;
      dateObj: Date;
    }[] = [];

    (currentEvent.expenses || []).slice(0, 6).forEach((exp) => {
      activities.push({
        id: `exp-${exp.id}`,
        type: "expense",
        title: `Logged ${exp.category} Expense`,
        subtitle: `${exp.description} (${formatCurrency(exp.actualAmount || exp.estimatedAmount, currency)})`,
        time: exp.createdAt ? formatDate(exp.createdAt) : "Recently",
        dateObj: new Date(exp.createdAt || 0),
      });
    });

    (currentEvent.vendors || []).slice(0, 6).forEach((v) => {
      activities.push({
        id: `ven-${v.id}`,
        type: "vendor",
        title: `Vendor: ${v.name} (${v.bookingStatus})`,
        subtitle: `${v.category} • ${formatCurrency(v.finalQuotation || v.quotation, currency)}`,
        time: v.createdAt ? formatDate(v.createdAt) : "Recently",
        dateObj: new Date(v.createdAt || 0),
      });
    });

    (currentEvent.tasks || [])
      .filter((t) => t.completed)
      .slice(0, 6)
      .forEach((t) => {
        activities.push({
          id: `task-${t.id}`,
          type: "task",
          title: `Milestone Done: ${t.title}`,
          subtitle: `${t.category} checklist item`,
          time: t.completedAt ? formatDate(t.completedAt) : t.createdAt ? formatDate(t.createdAt) : "Recently",
          dateObj: new Date(t.completedAt || t.createdAt || 0),
        });
      });

    return activities
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 5);
  }, [currentEvent, currency]);

  // Unique idea categories for filtering
  const availableIdeaCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add("All");
    (currentEvent?.ideas || []).forEach((i) => {
      if (i.category) cats.add(i.category);
    });
    return Array.from(cats);
  }, [currentEvent]);

  const filteredIdeas = useMemo(() => {
    const list = currentEvent?.ideas || [];
    if (selectedIdeaCategory === "All") return list;
    return list.filter(
      (i) => i.category.toLowerCase() === selectedIdeaCategory.toLowerCase()
    );
  }, [currentEvent, selectedIdeaCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-plum-900 via-plum-800 to-[#1F0A2C] text-white p-8 md:p-10 shadow-xl border border-plum-700/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gold-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 -mb-12 w-64 h-64 rounded-full bg-lavender-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Event Orchestration Platform</span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">
            Let&apos;s make your next celebration unforgettable.
          </h1>

          <p className="text-sm md:text-base text-lavender-100/80 leading-relaxed mb-6 font-light">
            Planora AI brings together generative intelligence, real-time budget
            allocation, vendor logistics, and precision timelines tailored for
            traditional and modern celebrations.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/creator">
              <Button variant="gold" size="md" className="shadow-lg">
                <Sparkles className="w-4 h-4 mr-1 text-plum-900" />
                Plan with AI Wizard
              </Button>
            </Link>
            <Link href="/assistant">
              <Button
                variant="outline"
                size="md"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white"
              >
                Chat with Event Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Event Callout Banner if current event is demo */}
      {currentEvent?.isDemo && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase tracking-wider text-[10px]">
              Demo Mode Active
            </span>
            <p className="font-medium">
              You are exploring sample data for <strong>{currentEvent.name}</strong>. Feel free to add expenses, vendors, or generate new AI plans!
            </p>
          </div>
          <Link href="/creator" className="text-xs font-bold text-amber-900 underline hover:no-underline">
            Create Real Event &rarr;
          </Link>
        </div>
      )}

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Events
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              {isLoading ? "..." : totalEvents}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Active in your workspace
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-plum-50 text-plum-800 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </Card>

        {/* Total Budget */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Budget
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              {isLoading ? "..." : formatCurrency(totalBudget, currency)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Allocated across events
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </Card>

        {/* Amount Spent */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Amount Spent
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              {isLoading ? "..." : formatCurrency(totalSpent, currency)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Across all categories
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
        </Card>

        {/* Pending Tasks */}
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Pending Tasks
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              {isLoading ? "..." : totalPendingTasks}
            </h3>
            <p className="text-[11px] text-plum-600 font-medium mt-0.5">
              Action items awaiting checkoff
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-plum-50 text-plum-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Active Event Deep-Dive & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Active Event Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Event Overview Card */}
          <Card className="p-6">
            <CardHeader className="mb-4">
              <div>
                <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
                  Currently Focused Event
                </span>
                <CardTitle className="text-xl font-bold text-stone-900 mt-0.5">
                  {currentEvent ? currentEvent.name : "No Event Selected"}
                </CardTitle>
                {currentEvent && (
                  <p className="text-xs text-stone-500 mt-1">
                    {currentEvent.eventType} • {formatDate(currentEvent.date)} (
                    {formatRelativeDays(currentEvent.date)}) •{" "}
                    {currentEvent.location} • {currentEvent.guestCount} guests
                  </p>
                )}
              </div>
              <Link href="/budget">
                <Button variant="outline" size="sm" className="text-xs">
                  Financials &rarr;
                </Button>
              </Link>
            </CardHeader>

            {currentEvent ? (
              <div className="space-y-6">
                {/* Budget Utilization Bar */}
                <div className="p-4 rounded-xl bg-ivory-warm border border-stone-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-stone-700">
                      Budget Utilization: {activeUtilization}%
                    </span>
                    <span className="text-stone-500">
                      Spent: {formatCurrency(activeSpent, currency)} / Allocated:{" "}
                      {formatCurrency(activeBudget, currency)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        activeUtilization > 95
                          ? "bg-rose-500"
                          : activeUtilization > 75
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-plum-600 to-plum-900"
                      }`}
                      style={{ width: `${Math.min(100, activeUtilization)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-stone-500 mt-2">
                    <span>
                      Remaining Balance:{" "}
                      <strong
                        className={
                          activeRemaining < 0
                            ? "text-rose-600"
                            : "text-emerald-700 font-bold"
                        }
                      >
                        {formatCurrency(activeRemaining, currency)}
                      </strong>
                    </span>
                    <span>
                      {activeRemaining < 0
                        ? "Over budget! Consider optimizing"
                        : "On budget"}
                    </span>
                  </div>
                </div>

                {/* Event Highlights & Progress Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-white border border-stone-100 shadow-sm">
                    <p className="text-[11px] font-semibold text-stone-500 uppercase">
                      Checklist Progress
                    </p>
                    <p className="text-xl font-bold text-plum-900 mt-1">
                      {taskProgress}%
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {completedTasks} of {activeTasks.length} tasks completed
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-stone-100 shadow-sm">
                    <p className="text-[11px] font-semibold text-stone-500 uppercase">
                      Vendor Bookings
                    </p>
                    <p className="text-xl font-bold text-plum-900 mt-1">
                      {bookedVendors} / {activeVendors.length}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Contracts locked in
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-stone-100 shadow-sm">
                    <p className="text-[11px] font-semibold text-stone-500 uppercase">
                      Theme Aesthetic
                    </p>
                    <p className="text-sm font-bold text-stone-800 mt-1 truncate">
                      {currentEvent.theme || "Curated Elegance"}
                    </p>
                    <p className="text-[11px] text-gold-600 font-medium mt-0.5">
                      AI Personalized
                    </p>
                  </div>
                </div>

                {/* Upcoming Deadlines List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-plum-600" />
                      Upcoming Deadlines & Milestones
                    </h4>
                    <Link
                      href="/timeline"
                      className="text-xs font-semibold text-plum-700 hover:text-plum-900 flex items-center gap-1"
                    >
                      View Timeline <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {upcomingTimelines.length === 0 ? (
                    <p className="text-xs text-stone-400 py-3 italic">
                      No upcoming milestones scheduled.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingTimelines.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-stone-100/70 transition-colors border border-stone-100"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {item.description || item.timeOfDay || "Milestone"}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-plum-100 text-plum-900 shrink-0">
                            {formatDate(item.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-stone-500 mb-4">
                  No active event selected or created yet.
                </p>
                <Link href="/creator">
                  <Button variant="primary">Create Your First Event</Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Recent Event Activity Stream */}
          {currentEvent && recentActivities.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-plum-700" />
                  <CardTitle className="text-base font-bold text-stone-900">
                    Recent Event Activity
                  </CardTitle>
                </div>
                <span className="text-xs text-stone-400">Live Workspace Stream</span>
              </div>

              <div className="divide-y divide-stone-100">
                {recentActivities.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          act.type === "expense"
                            ? "bg-amber-50 text-amber-700"
                            : act.type === "vendor"
                            ? "bg-plum-50 text-plum-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {act.type === "expense" ? (
                          <Receipt className="w-3.5 h-3.5" />
                        ) : act.type === "vendor" ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-stone-800">{act.title}</p>
                        <p className="text-[11px] text-stone-500">{act.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 shrink-0 font-medium">{act.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All Active Events List */}
          <Card className="p-6">
            <CardHeader className="mb-3">
              <CardTitle className="text-base font-bold text-stone-900">
                All Active Events ({events.length})
              </CardTitle>
              <Link
                href="/events"
                className="text-xs font-semibold text-plum-700 hover:text-plum-900 flex items-center gap-1"
              >
                Manage All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <div className="divide-y divide-stone-100">
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="py-3.5 flex items-center justify-between group hover:bg-stone-50/50 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-stone-900 group-hover:text-plum-800 transition-colors">
                        {evt.name}
                      </span>
                      {evt.isDemo && (
                        <span className="text-[9px] bg-gold-100 text-gold-700 font-bold px-1.5 py-0.2 rounded border border-gold-200">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {evt.eventType} • {formatDate(evt.date)} • {evt.location} •{" "}
                      {formatCurrency(evt.budget, currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold text-stone-700">
                        {evt.taskProgress}% done
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {evt.completedTasks}/{evt.totalTasks} tasks
                      </p>
                    </div>

                    {evt.id === currentEvent?.id ? (
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                        Active
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => switchEvent(evt.id)}
                        className="text-xs"
                      >
                        Switch
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 1 Column: AI Insights & Quick Assistant Actions */}
        <div className="space-y-6">
          {/* Personalized Event Ideas Card */}
          <Card className="p-6 bg-gradient-to-b from-white to-ivory-warm border-plum-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-gold-600 font-bold text-xs uppercase tracking-wider">
                <Lightbulb className="w-4 h-4 text-gold-500" />
                <span>Personalized Event Ideas</span>
              </div>
              {currentEvent && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateMoreIdeas}
                  disabled={isGeneratingIdeas}
                  className="text-[11px] h-7 px-2.5 py-0 border-gold-300 text-plum-900 bg-white/80 hover:bg-gold-50"
                >
                  {isGeneratingIdeas ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1 text-plum-600" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1 text-gold-600" />
                  )}
                  Generate AI Ideas
                </Button>
              )}
            </div>

            <h3 className="text-base font-bold text-stone-900 mb-2">
              Curated for {currentEvent?.name || "Your Event"}
            </h3>

            {/* Category filter pills */}
            {availableIdeaCategories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 my-3">
                {availableIdeaCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedIdeaCategory(cat)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      selectedIdeaCategory === cat
                        ? "bg-plum-900 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {filteredIdeas.length > 0 ? (
              <div className="space-y-3 mt-3">
                {filteredIdeas.slice(0, 4).map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-sm transition-all hover:border-plum-200"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-plum-700 bg-plum-50 px-2 py-0.5 rounded">
                        {idea.category}
                      </span>
                      <button
                        onClick={() => toggleBookmarkIdea(idea.id, Boolean(idea.saved))}
                        title={idea.saved ? "Saved to Bookmarks" : "Click to Bookmark"}
                        className="p-1 text-stone-400 hover:text-amber-500 transition-colors"
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            idea.saved
                              ? "fill-amber-400 text-amber-500"
                              : "text-stone-400"
                          }`}
                        />
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-stone-800 mt-1">
                      {idea.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                      {idea.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-center my-3">
                <p className="text-xs text-stone-500">
                  No ideas in this category yet. Click &ldquo;Generate AI Ideas&rdquo; to discover tailored concepts!
                </p>
              </div>
            )}

            <Link href="/assistant" className="block mt-4">
              <Button variant="secondary" size="sm" className="w-full text-xs">
                Explore More Concepts in AI Assistant &rarr;
              </Button>
            </Link>
          </Card>

          {/* Quick AI Action Cards */}
          <Card className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Quick AI Actions
            </h4>

            <Link href="/budget" className="block">
              <div className="p-3 rounded-xl border border-stone-200 hover:border-plum-300 hover:bg-plum-50/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Optimize Budget
                    </p>
                    <p className="text-[11px] text-stone-500">
                      AI audits expenses for savings
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800" />
              </div>
            </Link>

            <Link href="/checklist" className="block">
              <div className="p-3 rounded-xl border border-stone-200 hover:border-plum-300 hover:bg-plum-50/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-plum-50 text-plum-700 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Generate Smart Tasks
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Auto-detect missing checklist items
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800" />
              </div>
            </Link>

            <Link href="/vendors" className="block">
              <div className="p-3 rounded-xl border border-stone-200 hover:border-plum-300 hover:bg-plum-50/40 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-900">
                      Vendor Contracts
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Track quotes and booking status
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800" />
              </div>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
