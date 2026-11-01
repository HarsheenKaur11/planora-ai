"use client";

import React, { useState } from "react";
import {
  Clock,
  Calendar,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Sparkles,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useEvent, TimelineItem } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatRelativeDays } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const STATUSES = ["Upcoming", "In Progress", "Completed", "Delayed"];

export default function TimelinePage() {
  const { currentEvent, refreshCurrentEvent } = useEvent();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timelines = currentEvent?.timelineItems || [];
  const now = new Date();

  // Filter items
  const filteredTimelines = timelines.filter((item) => {
    if (filter === "all") return true;
    return item.status.toLowerCase() === filter.toLowerCase();
  });

  // Handle Add Milestone
  const handleAddMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        title: formData.get("title"),
        description: formData.get("description"),
        date: formData.get("date"),
        timeOfDay: formData.get("timeOfDay"),
        status: formData.get("status") || "Upcoming",
      };

      if (currentEvent?.date && new Date(payload.date as string) > new Date(currentEvent.date)) {
        showToast({
          type: "error",
          title: "Invalid Milestone Date",
          message: "Milestone date cannot fall after the event date.",
        });
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`/api/events/${currentEvent.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create milestone");
      }

      showToast({
        type: "success",
        title: "Milestone Added",
        message: "New milestone scheduled successfully.",
      });

      setIsAddModalOpen(false);
      await refreshCurrentEvent();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Failed to Add",
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Milestone
  const handleEditMilestone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent || !editingItem) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        id: editingItem.id,
        title: formData.get("title"),
        description: formData.get("description"),
        date: formData.get("date"),
        timeOfDay: formData.get("timeOfDay"),
        status: formData.get("status"),
      };

      if (currentEvent?.date && new Date(payload.date as string) > new Date(currentEvent.date)) {
        showToast({
          type: "error",
          title: "Invalid Milestone Date",
          message: "Milestone date cannot fall after the event date.",
        });
        setIsSubmitting(false);
        return;
      }

      const res = await fetch(`/api/events/${currentEvent.id}/timeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update milestone");
      }

      showToast({
        type: "success",
        title: "Milestone Updated",
        message: "Changes saved.",
      });

      setEditingItem(null);
      await refreshCurrentEvent();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = async (item: TimelineItem) => {
    if (!currentEvent) return;

    const nextStatus =
      item.status === "Completed"
        ? "Upcoming"
        : item.status === "Upcoming"
        ? "In Progress"
        : "Completed";

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/timeline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: nextStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle status");

      await refreshCurrentEvent();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Status Update Failed",
        message: err.message,
      });
    }
  };

  // Handle Delete Milestone
  const handleDeleteMilestone = async (id: string) => {
    if (!currentEvent) return;

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/timeline?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete milestone");

      showToast({
        type: "success",
        title: "Milestone Deleted",
        message: "The milestone was removed from the schedule.",
      });

      await refreshCurrentEvent();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
            Chronological Run-Sheet
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mt-0.5">
            Intelligent Event Timeline
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Event Target: <strong>{formatDate(currentEvent?.date)}</strong> (
            {formatRelativeDays(currentEvent?.date || new Date())})
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle className="w-4 h-4 mr-1 text-plum-950" />
          Add Milestone
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        {["all", "upcoming", "in progress", "completed"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filter === st
                ? "bg-plum-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {st === "all" ? `All Milestones (${timelines.length})` : st}
          </button>
        ))}
      </div>

      {/* Timeline Journey Stream */}
      {filteredTimelines.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No milestones found
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            Add your preparation checkpoints and event-day execution schedule.
          </p>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Schedule First Milestone
          </Button>
        </Card>
      ) : (
        <div className="relative pl-6 sm:pl-8 border-l-2 border-plum-200 space-y-6 my-4">
          {filteredTimelines.map((item, idx) => {
            const itemDate = new Date(item.date);
            const isOverdue =
              itemDate < now && item.status !== "Completed";
            const isCompleted = item.status === "Completed";

            return (
              <div key={item.id} className="relative group">
                {/* Node on vertical line */}
                <button
                  onClick={() => handleToggleStatus(item)}
                  title={`Status: ${item.status}. Click to advance status.`}
                  className={`absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                      : isOverdue
                      ? "bg-rose-600 text-white ring-4 ring-rose-100 animate-pulse"
                      : item.status === "In Progress"
                      ? "bg-amber-500 text-white ring-4 ring-amber-100"
                      : "bg-plum-900 text-white ring-4 ring-plum-100"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isOverdue ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Milestone Card */}
                <Card
                  className={`p-5 transition-all ${
                    isCompleted
                      ? "bg-stone-50/70 border-stone-200/60 opacity-80"
                      : isOverdue
                      ? "border-rose-300 shadow-sm bg-rose-50/20"
                      : "hover:border-plum-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-plum-900">
                        {formatDate(item.date)}
                      </span>
                      {item.timeOfDay && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          {item.timeOfDay}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-400">
                        ({formatRelativeDays(item.date)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          OVERDUE
                        </span>
                      )}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                          item.status === "Completed"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                            : item.status === "In Progress"
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-plum-50 text-plum-800 border-plum-200 hover:bg-plum-100"
                        }`}
                      >
                        {item.status} &rarr;
                      </button>
                    </div>
                  </div>

                  <h3
                    className={`text-base font-bold text-stone-900 ${
                      isCompleted ? "line-through text-stone-500" : ""
                    }`}
                  >
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-stone-100">
                    <button
                      onClick={() => setEditingItem(item)}
                      title="Edit"
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMilestone(item.id)}
                      title="Delete"
                      className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Milestone Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Schedule Milestone"
          description="Add a date-bound preparation event or day-of run item."
        >
          <form onSubmit={handleAddMilestone} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Milestone Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Stage Soundcheck & Lighting rehearsal"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  max={currentEvent?.date ? new Date(currentEvent.date).toISOString().split("T")[0] : undefined}
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Time / Slot
                </label>
                <input
                  type="text"
                  name="timeOfDay"
                  placeholder="e.g. 10:00 AM or Morning"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status
              </label>
              <select
                name="status"
                defaultValue="Upcoming"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description / Action Items
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Log key contacts, deliverables, or checklist steps..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                Schedule Milestone
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Milestone Modal */}
      {editingItem && (
        <Modal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          title="Edit Milestone"
          description="Update schedule timing or status."
        >
          <form onSubmit={handleEditMilestone} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Milestone Title
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editingItem.title}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date(editingItem.date).toISOString().split("T")[0]}
                  max={currentEvent?.date ? new Date(currentEvent.date).toISOString().split("T")[0] : undefined}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Time / Slot
                </label>
                <input
                  type="text"
                  name="timeOfDay"
                  defaultValue={editingItem.timeOfDay || ""}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status
              </label>
              <select
                name="status"
                defaultValue={editingItem.status}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                defaultValue={editingItem.description || ""}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
