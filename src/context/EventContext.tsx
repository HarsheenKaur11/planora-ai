"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ExpenseItem {
  id: string;
  eventId: string;
  category: string;
  description: string;
  estimatedAmount: number;
  actualAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export interface VendorItem {
  id: string;
  eventId: string;
  name: string;
  category: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  quotation: number;
  finalQuotation?: number | null;
  bookingStatus: string;
  paymentStatus: string;
  notes?: string | null;
  rating?: number | null;
  website?: string | null;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  category: string;
  priority: string;
  dueDate?: string | null;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
}

export interface TimelineItem {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  date: string;
  status: string;
  timeOfDay?: string | null;
  createdAt: string;
}

export interface IdeaItem {
  id: string;
  eventId: string;
  category: string;
  title: string;
  description: string;
  tags?: string | null;
  saved: boolean;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  eventId: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface EventDetail {
  id: string;
  userId: string;
  name: string;
  eventType: string;
  date: string;
  location: string;
  guestCount: number;
  budget: number;
  description?: string | null;
  theme?: string | null;
  themeDescription?: string | null;
  indoorOutdoor?: string | null;
  culturalPref?: string | null;
  dietaryPref?: string | null;
  isDemo: boolean;
  status: string;
  createdAt: string;
  expenses: ExpenseItem[];
  vendors: VendorItem[];
  tasks: TaskItem[];
  timelineItems: TimelineItem[];
  ideas: IdeaItem[];
  chatMessages: ChatMessageItem[];
}

export interface EventSummary {
  id: string;
  name: string;
  eventType: string;
  date: string;
  location: string;
  guestCount: number;
  budget: number;
  isDemo: boolean;
  status: string;
  totalSpent: number;
  completedTasks: number;
  totalTasks: number;
  taskProgress: number;
}

interface EventContextType {
  events: EventSummary[];
  currentEvent: EventDetail | null;
  currentEventId: string | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  currency: string;
  switchEvent: (eventId: string) => void;
  refreshEvents: () => Promise<void>;
  refreshCurrentEvent: () => Promise<void>;
  updateCurrency: (newCurrency: string) => void;
  toggleBookmarkIdea: (ideaId: string, currentSaved: boolean) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [currentEvent, setCurrentEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [currency, setCurrency] = useState("INR");

  // Load saved currency from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("planora_currency");
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
    }
  }, []);

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/events");
      if (res.ok) {
        const data: EventSummary[] = await res.json();
        setEvents(data);

        // Determine active event ID
        const storedId = typeof window !== "undefined" ? localStorage.getItem("planora_active_event_id") : null;
        if (storedId && data.some((e) => e.id === storedId)) {
          setCurrentEventId(storedId);
        } else if (data.length > 0) {
          setCurrentEventId(data[0].id);
          if (typeof window !== "undefined") {
            localStorage.setItem("planora_active_event_id", data[0].id);
          }
        } else {
          setCurrentEventId(null);
        }
      }
    } catch (err) {
      console.error("Failed to load events list", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch current event detail
  const fetchCurrentEvent = useCallback(async () => {
    if (!currentEventId) {
      setCurrentEvent(null);
      return;
    }

    try {
      setIsDetailLoading(true);
      const res = await fetch(`/api/events/${currentEventId}`);
      if (res.ok) {
        const detail: EventDetail = await res.json();
        setCurrentEvent(detail);
      } else {
        console.warn("Event not found or removed");
        setCurrentEvent(null);
      }
    } catch (err) {
      console.error("Failed to load event details", err);
      setCurrentEvent(null);
    } finally {
      setIsDetailLoading(false);
    }
  }, [currentEventId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (currentEventId) {
      fetchCurrentEvent();
    }
  }, [currentEventId, fetchCurrentEvent]);

  const switchEvent = useCallback((eventId: string) => {
    setCurrentEventId(eventId);
    if (typeof window !== "undefined") {
      localStorage.setItem("planora_active_event_id", eventId);
    }
  }, []);

  const updateCurrency = useCallback((newCurrency: string) => {
    setCurrency(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("planora_currency", newCurrency);
    }
  }, []);

  const toggleBookmarkIdea = useCallback(
    async (ideaId: string, currentSaved: boolean) => {
      try {
        const res = await fetch(`/api/events/${currentEventId}/ideas`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: ideaId, saved: !currentSaved }),
        });
        if (res.ok) {
          // Optimistically update currentEvent ideas
          setCurrentEvent((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              ideas: prev.ideas.map((idea) =>
                idea.id === ideaId ? { ...idea, saved: !currentSaved } : idea
              ),
            };
          });
        }
      } catch (err) {
        console.error("Failed to toggle idea bookmark", err);
      }
    },
    [currentEventId]
  );

  return (
    <EventContext.Provider
      value={{
        events,
        currentEvent,
        currentEventId,
        isLoading,
        isDetailLoading,
        currency,
        switchEvent,
        refreshEvents: fetchEvents,
        refreshCurrentEvent: fetchCurrentEvent,
        updateCurrency,
        toggleBookmarkIdea,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}
