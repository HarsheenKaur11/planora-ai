"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Globe,
  Wallet,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useEvent } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham (AED)" },
];

const LANGUAGES = [
  "English",
  "Hindi (हिंदी)",
  "Punjabi (ਪੰਜਾਬੀ)",
  "Bengali (বাংলা)",
  "Marathi (मराठी)",
  "Tamil (தமிழ்)",
  "Telugu (తెలుగు)",
  "Gujarati (ગુજરાતી)",
];

export default function SettingsPage() {
  const { currency, updateCurrency, refreshEvents } = useEvent();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [formData, setFormData] = useState({
    name: "Aarav Sharma",
    email: "demo@planora.ai",
    location: "New Delhi, India",
    currency: "INR",
    language: "English",
    dietary: "North Indian Gourmet & Vegetarian balance",
    themeStyle: "Royal, minimalist and floral",
  });

  // Load user from /api/user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/user");
        if (res.ok) {
          const user = await res.json();
          let parsedPrefs: any = {};
          if (user.preferences) {
            try {
              parsedPrefs = typeof user.preferences === "string" ? JSON.parse(user.preferences) : user.preferences;
            } catch (e) {}
          }

          setFormData({
            name: user.name || "Aarav Sharma",
            email: user.email || "demo@planora.ai",
            location: user.location || "New Delhi, India",
            currency: user.currency || "INR",
            language: user.language || "English",
            dietary: parsedPrefs.dietary || "North Indian & vegetarian/non-vegetarian balance",
            themeStyle: parsedPrefs.themeStyle || "Royal, minimalist and floral",
          });
        }
      } catch (err) {
        console.error("Failed to load user settings", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          location: formData.location,
          currency: formData.currency,
          language: formData.language,
          preferences: {
            dietary: formData.dietary,
            themeStyle: formData.themeStyle,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");

      updateCurrency(formData.currency);

      showToast({
        type: "success",
        title: "Settings Saved",
        message: "Your profile and preference configuration have been updated.",
      });
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Save Failed",
        message: err.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!confirm("Reset database with the rich Indian wedding demo event? Any test events will be retained or refreshed.")) {
      return;
    }

    try {
      setIsResetting(true);
      const res = await fetch("/api/seed", { method: "POST" });
      if (!res.ok) throw new Error("Failed to seed demo data");

      showToast({
        type: "success",
        title: "Demo Data Restored",
        message: "Aarav & Meera's Royal Punjabi Wedding demo data is now reloaded.",
      });

      await refreshEvents();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Reset Failed",
        message: err.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
          Platform Configuration
        </span>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mt-0.5">
          Settings & Onboarding Profile
        </h1>
        <p className="text-xs md:text-sm text-stone-500 mt-0.5">
          Configure regional defaults, currency formatting, and demo environment options.
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* User Identity & Demo Mode */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <User className="w-4 h-4 text-plum-700" />
              User Profile & Onboarding
            </CardTitle>
            <span className="text-[10px] bg-gold-100 text-gold-800 font-bold px-2.5 py-0.5 rounded-full border border-gold-200">
              Demo Guest Profile Active
            </span>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Full Name / Organizer Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Default Location / City
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. New Delhi, India"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>
          </div>
        </Card>

        {/* Currency & Regional Preferences */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Currency & Language Localization
            </CardTitle>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preferred Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-stone-500 mt-1">
                Indian numbering format (e.g. ₹12,00,000) applied for INR.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Platform Language
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* General Planning Defaults */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              Default Planning Preferences
            </CardTitle>
          </CardHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Dietary Defaults
              </label>
              <input
                type="text"
                name="dietary"
                value={formData.dietary}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Preferred Aesthetic Style
              </label>
              <input
                type="text"
                name="themeStyle"
                value={formData.themeStyle}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="gold"
            size="md"
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-1 text-plum-950" />
            Save Profile Settings
          </Button>
        </div>
      </form>

      {/* Demo Data Management Card */}
      <Card className="p-6 border-amber-200 bg-amber-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              Restore Demo Wedding Data
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-xl leading-relaxed">
              Resets the database with the rich sample event &ldquo;Aarav &amp; Meera&apos;s Royal Punjabi Wedding&rdquo;,
              including 9 expenses, 5 vendors, 6 tasks, 7 timeline milestones, and 4 ideas.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            isLoading={isResetting}
            onClick={handleResetDemoData}
            className="border-amber-300 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            Re-seed Demo Event
          </Button>
        </div>
      </Card>
    </div>
  );
}
