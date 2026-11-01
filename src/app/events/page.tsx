"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  PlusCircle,
  MapPin,
  Users,
  Wallet,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useEvent, EventSummary } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export default function MyEventsPage() {
  const { events, currentEventId, switchEvent, refreshEvents, currency } = useEvent();
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<EventSummary | null>(null);
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (filterStatus === "all") return true;
    return evt.status.toLowerCase() === filterStatus.toLowerCase();
  });

  // Handle Edit Submit
  const handleUpdateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        name: formData.get("name"),
        eventType: formData.get("eventType"),
        date: formData.get("date"),
        location: formData.get("location"),
        guestCount: Number(formData.get("guestCount")),
        budget: Number(formData.get("budget")),
        status: formData.get("status"),
      };

      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update event");

      showToast({
        type: "success",
        title: "Event Updated",
        message: "Your event details were saved successfully.",
      });

      setEditingEvent(null);
      await refreshEvents();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Update Failed",
        message: err.message || "Could not update event.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Event
  const handleDeleteEvent = async () => {
    if (!deleteEventId) return;

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/events/${deleteEventId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete event");

      showToast({
        type: "success",
        title: "Event Deleted",
        message: "The event and its records were removed.",
      });

      setDeleteEventId(null);
      await refreshEvents();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Delete Failed",
        message: err.message || "Could not delete event.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900">
            My Events
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-1">
            View, manage, and switch between your planned celebrations.
          </p>
        </div>

        <Link href="/creator">
          <Button variant="gold" size="md">
            <PlusCircle className="w-4 h-4 mr-1 text-plum-900" />
            New AI Event
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        {["all", "planning", "confirmed", "completed"].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filterStatus === st
                ? "bg-plum-900 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {st === "all" ? `All Events (${events.length})` : st}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarDays className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No events found</h3>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            There are no events matching this filter category.
          </p>
          <Link href="/creator">
            <Button variant="primary">Create an Event with AI</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((evt) => {
            const isActive = evt.id === currentEventId;

            return (
              <Card
                key={evt.id}
                className={`p-6 flex flex-col justify-between transition-all relative ${
                  isActive
                    ? "ring-2 ring-plum-800 border-plum-300 shadow-md"
                    : "hover:border-plum-200 hover:shadow-cardHover"
                }`}
              >
                <div>
                  {/* Status & Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-plum-50 text-plum-800 border border-plum-100">
                      {evt.eventType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {evt.isDemo && (
                        <span className="text-[9px] bg-gold-100 text-gold-700 font-bold px-1.5 py-0.2 rounded border border-gold-200">
                          DEMO
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full ${
                          evt.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : evt.status === "confirmed"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {evt.status}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-plum-900 transition-colors line-clamp-1">
                    {evt.name}
                  </h3>

                  {/* Meta items */}
                  <div className="space-y-1.5 mt-3 text-xs text-stone-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{formatDate(evt.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{evt.guestCount} Estimated Guests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>
                        Budget:{" "}
                        <strong className="text-stone-900">
                          {formatCurrency(evt.budget, currency)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-stone-500">Tasks Completed</span>
                      <span className="font-bold text-plum-900">
                        {evt.taskProgress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-plum-700 rounded-full"
                        style={{ width: `${evt.taskProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <Check className="w-3.5 h-3.5" /> Selected Event
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchEvent(evt.id)}
                      className="text-xs"
                    >
                      Make Active
                    </Button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingEvent(evt)}
                      title="Edit Event"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteEventId(evt.id)}
                      title="Delete Event"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <Modal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          title="Edit Event Details"
          description="Update your event's core details and preferences."
        >
          <form onSubmit={handleUpdateEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Event Name
              </label>
              <input
                name="name"
                defaultValue={editingEvent.name}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Event Type
                </label>
                <select
                  name="eventType"
                  defaultValue={editingEvent.eventType}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Corporate event">Corporate event</option>
                  <option value="Festival">Festival</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={editingEvent.status}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  <option value="planning">Planning</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Event Date
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={editingEvent.date ? new Date(editingEvent.date).toISOString().split("T")[0] : ""}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Estimated Guests
                </label>
                <input
                  type="number"
                  name="guestCount"
                  defaultValue={editingEvent.guestCount}
                  required
                  min="1"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  defaultValue={editingEvent.location}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Budget ({currency})
                </label>
                <input
                  type="number"
                  name="budget"
                  defaultValue={editingEvent.budget}
                  required
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingEvent(null)}
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

      {/* Delete Confirmation Modal */}
      {deleteEventId && (
        <Modal
          isOpen={!!deleteEventId}
          onClose={() => setDeleteEventId(null)}
          title="Delete Event?"
          description="This action cannot be undone. All tasks, expenses, vendors, and timeline items associated with this event will be permanently deleted."
          maxWidth="sm"
        >
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteEventId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleDeleteEvent}
            >
              Confirm Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
