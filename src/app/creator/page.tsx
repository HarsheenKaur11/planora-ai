"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Users,
  Wallet,
  Palette,
  HeartHandshake,
  Clock,
  Check,
  Bot,
  Lightbulb,
} from "lucide-react";
import { PlanOutput, AIPlanResponse } from "@/lib/ai/types";
import { useEvent } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const EVENT_TYPES = [
  "Wedding",
  "Birthday",
  "Anniversary",
  "Engagement",
  "Baby shower",
  "Community gathering",
  "Festival",
  "Corporate event",
  "Other",
];

const PROMPT_SUGGESTIONS = [
  "I want to organize a beautiful traditional Punjabi wedding in Delhi for approximately 250 guests with a budget of ₹12 lakh. I prefer elegant floral decorations, traditional food, and a royal yet minimal theme.",
  "Planning a fun 1st birthday party for 60 guests in South Mumbai with a budget of ₹1.5 lakh. Want a pastel cloud & star theme, interactive games, and custom cake.",
  "Golden 25th Wedding Anniversary celebration for 100 guests in Bangalore with ₹4 lakh budget. Prefer an outdoor garden banquet, live acoustic music, and candlelight ambiance.",
];

export default function CreatorPage() {
  const router = useRouter();
  const { switchEvent, refreshEvents, currency } = useEvent();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AIPlanResponse | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    eventType: "Wedding",
    date: "",
    location: "New Delhi, India",
    guestCount: 150,
    budget: 800000,
    description: "",
    preferredTheme: "",
    indoorOutdoor: "Both",
    dietaryPreferences: "North Indian & Global Fusion",
    culturalPreferences: "Traditional Indian",
    venueType: "Banquet Hall & Lawn",
    specialRequirements: "",
    numberOfDays: 1,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "guestCount" || name === "budget" || name === "numberOfDays"
          ? Number(value)
          : value,
    }));
  };

  const handleGeneratePlan = async () => {
    if (!formData.name || !formData.date || !formData.location) {
      showToast({
        type: "error",
        title: "Required Fields Missing",
        message: "Please fill in the event name, date, and location.",
      });
      return;
    }

    try {
      setIsGenerating(true);
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Plan generation failed");
      }

      const data: AIPlanResponse = await res.json();
      setGeneratedResult(data);
      setStep(3);

      showToast({
        type: "success",
        title: "AI Plan Ready",
        message: `Plan generated via ${data.modelName}!`,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Generation Error",
        message: err.message || "Failed to generate plan. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndCommit = async () => {
    if (!generatedResult) return;

    try {
      setIsSaving(true);
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          theme: generatedResult.plan.recommended_theme,
          themeDescription: generatedResult.plan.theme_description,
          initialPlan: generatedResult.plan,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save event to database");
      }

      const createdEvent = await res.json();

      showToast({
        type: "success",
        title: "Event Successfully Created!",
        message: `"${createdEvent.name}" has been saved with full budget, vendor, and timeline data.`,
      });

      await refreshEvents();
      switchEvent(createdEvent.id);
      router.push("/");
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Save Failed",
        message: err.message || "Could not save event.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-700 border border-gold-300 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Event Planning Wizard</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">
          Design Your Celebration
        </h1>
        <p className="text-xs md:text-sm text-stone-500 mt-1">
          Tell us your dream vision in natural language or structured details.
          Our AI synthesizes themes, budgets, vendors, and milestones instantly.
        </p>
      </div>

      {/* Wizard Progress Indicator */}
      <div className="flex items-center justify-center gap-3 text-xs font-bold">
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            step >= 1 ? "bg-plum-900 text-white" : "bg-stone-200 text-stone-500"
          }`}
        >
          <span>1</span> Core Parameters
        </div>
        <div className="w-6 h-0.5 bg-stone-300" />
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            step >= 2 ? "bg-plum-900 text-white" : "bg-stone-200 text-stone-500"
          }`}
        >
          <span>2</span> Vision & Nuances
        </div>
        <div className="w-6 h-0.5 bg-stone-300" />
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            step === 3 ? "bg-gold-500 text-plum-950 font-bold" : "bg-stone-200 text-stone-500"
          }`}
        >
          <span>3</span> AI Generated Plan
        </div>
      </div>

      {/* Step 1: Core Parameters */}
      {step === 1 && (
        <Card className="p-6 md:p-8 space-y-6">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Step 1: Event Fundamentals</CardTitle>
              <p className="text-xs text-stone-500 mt-0.5">
                Set the foundational numbers and location for your gathering.
              </p>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Event Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Event Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g. Rohini & Siddharth's Sangeet & Wedding"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                required
              />
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Event Type <span className="text-rose-500">*</span>
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Event Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Location / City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. South Delhi, India or Udaipur, Rajasthan"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                required
              />
            </div>

            {/* Guest Count */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Estimated Guest Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="guestCount"
                value={formData.guestCount}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                required
              />
            </div>

            {/* Total Budget */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Total Budget ({currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  min="0"
                  step="5000"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                  required
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Formatted preview:{" "}
                <strong className="text-plum-900">
                  {formatCurrency(formData.budget, currency)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-100">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                if (!formData.name || !formData.date) {
                  showToast({
                    type: "error",
                    title: "Missing Details",
                    message: "Please enter an event name and target date.",
                  });
                  return;
                }
                setStep(2);
              }}
            >
              Continue to Vision <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Vision & Cultural Nuances */}
      {step === 2 && (
        <Card className="p-6 md:p-8 space-y-6">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Step 2: Describe Your Dream Event</CardTitle>
              <p className="text-xs text-stone-500 mt-0.5">
                Add natural language descriptions and stylistic preferences.
              </p>
            </div>
          </CardHeader>

          {/* Natural Language Prompt Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-stone-700">
              Natural Language Prompt (&quot;Describe your dream event...&quot;)
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your vision, colors, food preferences, guest experiences, or any specific cultural details..."
              className="w-full p-4 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 leading-relaxed"
            />

            {/* Prompt Suggestion Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-stone-500">
                Try a realistic example prompt:
              </span>
              <div className="space-y-1.5">
                {PROMPT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, description: sug }))
                    }
                    className="block text-left text-xs p-2 rounded-lg bg-stone-50 hover:bg-plum-50 hover:text-plum-900 border border-stone-200/60 text-stone-600 transition-colors"
                  >
                    &ldquo;{sug}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-stone-100">
            {/* Preferred Theme */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preferred Theme / Aesthetic
              </label>
              <input
                type="text"
                name="preferredTheme"
                value={formData.preferredTheme}
                onChange={handleInputChange}
                placeholder="e.g. Royal Ivory & Champagne Gold, Bohemian Pastel"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            {/* Indoor / Outdoor */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Setting Preference
              </label>
              <select
                name="indoorOutdoor"
                value={formData.indoorOutdoor}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                <option value="Both">Both (Banquet Hall & Open Lawn)</option>
                <option value="Indoor">Indoor AC Banquet / Hotel</option>
                <option value="Outdoor">Outdoor Lawn / Farmhouse / Beach</option>
                <option value="Flexible">Flexible / Undecided</option>
              </select>
            </div>

            {/* Dietary Preferences */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Dietary & Catering Preferences
              </label>
              <input
                type="text"
                name="dietaryPreferences"
                value={formData.dietaryPreferences}
                onChange={handleInputChange}
                placeholder="e.g. Pure Vegetarian, Live Street Chaat Counters, Jain options"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            {/* Cultural Preferences */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Cultural / Regional Preferences
              </label>
              <input
                type="text"
                name="culturalPreferences"
                value={formData.culturalPreferences}
                onChange={handleInputChange}
                placeholder="e.g. Punjabi Traditional, South Indian Vedic, Contemporary"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            {/* Preferred Venue Type */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preferred Venue Style / Structure
              </label>
              <input
                type="text"
                name="venueType"
                value={formData.venueType}
                onChange={handleInputChange}
                placeholder="e.g. Palace Heritage Hotel, 5-Star Ballroom, Private Farmhouse"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            {/* Number of Event Days */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Number of Event Days
              </label>
              <input
                type="number"
                name="numberOfDays"
                min="1"
                max="10"
                value={formData.numberOfDays}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            {/* Special Requirements */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Special Requirements & Accessibility
              </label>
              <input
                type="text"
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleInputChange}
                placeholder="e.g. Senior citizen wheelchair access, pet-friendly lawn, late night acoustic permit"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <Button
              type="button"
              variant="gold"
              isLoading={isGenerating}
              onClick={handleGeneratePlan}
            >
              <Sparkles className="w-4 h-4 mr-1 text-plum-900" />
              Generate AI Event Plan
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: AI Generated Plan Presentation */}
      {step === 3 && generatedResult && (
        <div className="space-y-6">
          {/* AI Model Badge Banner */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border ${
              generatedResult.source === "gemini"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-plum-50 border-plum-200 text-plum-900"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  generatedResult.source === "gemini"
                    ? "bg-emerald-600 text-white"
                    : "bg-plum-800 text-gold-300"
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Generation Engine
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-bold border border-stone-200">
                    {generatedResult.modelName}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Plan personalized for {formData.name} ({formData.eventType} in {formData.location})
                </p>
              </div>
            </div>

            <Button
              variant="gold"
              size="md"
              isLoading={isSaving}
              onClick={handleSaveAndCommit}
            >
              <Check className="w-4 h-4 mr-1 text-plum-900" />
              Save & Launch Event
            </Button>
          </div>

          {/* Event Summary & Theme */}
          <Card className="p-6 md:p-8 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
                Executive Concept
              </span>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mt-1">
                {generatedResult.plan.recommended_theme}
              </h2>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                {generatedResult.plan.event_summary}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ivory-warm border border-stone-200">
              <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-1">
                Aesthetic & Decor Direction
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {generatedResult.plan.theme_description}
              </p>
            </div>
          </Card>

          {/* Budget Breakdown Preview */}
          <Card className="p-6">
            <CardHeader>
              <div>
                <CardTitle className="text-base font-bold text-stone-900">
                  Recommended Budget Allocation
                </CardTitle>
                <p className="text-xs text-stone-500">
                  Total Budget: {formatCurrency(formData.budget, currency)}
                </p>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {generatedResult.plan.budget_breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-stone-200/80 bg-white"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-stone-800">
                    <span>{item.category}</span>
                    <span className="text-plum-800 font-bold">
                      {item.percentage}%
                    </span>
                  </div>
                  <p className="text-sm font-bold text-stone-900 mt-1">
                    {formatCurrency(item.allocated_amount, currency)}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Preparation Timeline & Key Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Timeline */}
            <Card className="p-6">
              <CardTitle className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-plum-700" />
                Preparation Milestones
              </CardTitle>
              <div className="space-y-3">
                {generatedResult.plan.preparation_timeline.map((pt, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-800">
                        {pt.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-plum-100 text-plum-900">
                        {pt.timeframe}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">{pt.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Checklist */}
            <Card className="p-6">
              <CardTitle className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Key Action Checklist
              </CardTitle>
              <div className="space-y-3">
                {generatedResult.plan.checklist.map((chk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-800">
                        {chk.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          chk.priority === "High"
                            ? "bg-rose-100 text-rose-800"
                            : chk.priority === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {chk.priority} Priority
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">{chk.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommended Vendor Categories & Day-of Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Categories */}
            <Card className="p-6">
              <CardTitle className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-600" />
                Recommended Vendor Categories
              </CardTitle>
              <div className="space-y-3">
                {generatedResult.plan.vendor_categories.map((vc, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-800">{vc.name}</span>
                      <span className="text-xs font-bold text-plum-900">
                        {formatCurrency(vc.estimated_budget, currency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">{vc.notes}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Event-Day Hourly Schedule */}
            <Card className="p-6">
              <CardTitle className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-plum-800" />
                Event-Day Hourly Run-Sheet
              </CardTitle>
              <div className="space-y-3">
                {generatedResult.plan.event_day_schedule.map((eds, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-stone-800">{eds.activity}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold-100 text-gold-900">
                        {eds.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">{eds.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Personalized Ideas & Recommendations */}
          <Card className="p-6">
            <CardTitle className="text-base font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-gold-500" />
              Personalized Recommendations & Ideas
            </CardTitle>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {generatedResult.plan.personalized_ideas.map((idea, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-stone-200/80 bg-white"
                >
                  <span className="text-[10px] font-bold text-plum-700 bg-plum-50 px-2 py-0.5 rounded">
                    {idea.category}
                  </span>
                  <h4 className="text-xs font-bold text-stone-800 mt-1">
                    {idea.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                    {idea.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-stone-100 space-y-2">
              <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Expert Planning Tips
              </h5>
              <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                {generatedResult.plan.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Re-adjust Vision
            </Button>

            <Button
              variant="gold"
              size="lg"
              isLoading={isSaving}
              onClick={handleSaveAndCommit}
            >
              <Check className="w-5 h-5 mr-1 text-plum-900" />
              Save Plan & Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
