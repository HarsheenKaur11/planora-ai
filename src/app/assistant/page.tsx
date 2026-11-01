"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BotMessageSquare,
  Send,
  Sparkles,
  User,
  Bot,
  Lightbulb,
  Clock,
  Wallet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useEvent, ChatMessageItem } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const PROMPT_CHIPS = [
  "How can I reduce my wedding budget by ₹50,000?",
  "What tasks are overdue?",
  "How much have I spent on catering?",
  "What should I book first?",
  "Suggest alternatives for expensive photography packages.",
  "Create a schedule for the wedding day.",
];

export default function AssistantPage() {
  const { currentEvent, currency } = useEvent();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(PROMPT_CHIPS);
  const [sourceModel, setSourceModel] = useState<string>("AI Assistant");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat history for active event
  useEffect(() => {
    if (!currentEvent) {
      setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/events/${currentEvent.id}/chat`);
        if (res.ok) {
          const data: ChatMessageItem[] = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
    };

    fetchHistory();
  }, [currentEvent]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || !currentEvent || isLoading) return;

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: Math.random().toString(),
      eventId: currentEvent.id,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error("Failed to receive AI response");
      }

      const data = await res.json();
      setMessages((prev) => [...prev.slice(0, -1), data.userMessage, data.assistantMessage]);
      if (data.source) setSourceModel(data.source);
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Assistant Error",
        message: err.message || "Failed to reach AI Assistant.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Active event summary stats
  const totalBudget = currentEvent?.budget || 0;
  const totalSpent = (currentEvent?.expenses || []).reduce(
    (acc, c) => acc + (c.actualAmount || c.estimatedAmount || 0),
    0
  );
  const pendingTasksCount = (currentEvent?.tasks || []).filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-stone-900">
              Conversational AI Event Assistant
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-200">
              {sourceModel}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Active Context: <strong>{currentEvent?.name || "No event"}</strong> (
            Budget: {formatCurrency(totalBudget, currency)} • Spent:{" "}
            {formatCurrency(totalSpent, currency)} • {pendingTasksCount} tasks pending)
          </p>
        </div>
      </div>

      {/* Chat Messages Container */}
      <Card className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col space-y-4 bg-gradient-to-b from-[#FAF9F5] to-white">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-plum-100 text-plum-800 flex items-center justify-center mb-4 shadow-sm">
              <BotMessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">
              How can I assist your planning today?
            </h3>
            <p className="text-xs text-stone-500 mb-6 leading-relaxed">
              I have loaded all facts, expenses, vendors, and deadlines for{" "}
              <strong>{currentEvent?.name || "your event"}</strong>. Ask me
              anything from budget cuts to run-sheet details.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-sm ${
                    isUser
                      ? "bg-plum-900 text-gold-300"
                      : "bg-gradient-to-tr from-gold-500 to-amber-400 text-plum-950"
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-plum-900 text-white rounded-tr-none"
                      : "bg-white border border-stone-200 text-stone-800 rounded-tl-none whitespace-pre-line"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-gold-400 text-plum-950 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 text-stone-500 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-plum-700" />
              <span>Analyzing saved event facts & formulating recommendation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </Card>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
        <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0">
          Suggestions:
        </span>
        {suggestions.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSendMessage(chip)}
            className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-white hover:bg-plum-50 hover:text-plum-900 border border-stone-200 text-stone-700 shrink-0 transition-colors shadow-2xs"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-stone-200 shadow-sm">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${currentEvent?.name || "your event"}... (e.g. How can I optimize catering costs?)`}
          disabled={isLoading || !currentEvent}
          className="flex-1 px-4 py-2 text-xs md:text-sm focus:outline-none bg-transparent"
        />
        <Button
          variant="gold"
          size="md"
          isLoading={isLoading}
          disabled={!inputValue.trim() || !currentEvent}
          onClick={() => handleSendMessage()}
          className="shrink-0"
        >
          <Send className="w-4 h-4 text-plum-950" />
        </Button>
      </div>
    </div>
  );
}
