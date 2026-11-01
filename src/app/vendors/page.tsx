"use client";

import React, { useState, useMemo } from "react";
import {
  Users2,
  PlusCircle,
  Search,
  Phone,
  Mail,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  Sparkles,
  DollarSign,
  TrendingDown,
  Building2,
  Loader2,
} from "lucide-react";
import { useEvent, VendorItem } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const VENDOR_CATEGORIES = [
  "All",
  "Venue",
  "Caterer",
  "Decorator",
  "Photographer",
  "Videographer",
  "Makeup artist",
  "Florist",
  "DJ",
  "Entertainment",
  "Transportation",
  "Accommodation",
  "Other",
];

const BOOKING_STATUSES = [
  "Not contacted",
  "Contacted",
  "Negotiating",
  "Shortlisted",
  "Booked",
  "Cancelled",
];

const PAYMENT_STATUSES = ["Unpaid", "Advance Paid", "Fully Paid"];

export default function VendorsPage() {
  const { currentEvent, refreshCurrentEvent, currency } = useEvent();
  const { showToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [isAiSuggestModalOpen, setIsAiSuggestModalOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiSource, setAiSource] = useState<string>("Planora AI Vendor Sourcing");
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendors = currentEvent?.vendors || [];

  const handleOpenAiSuggest = async () => {
    setIsAiSuggestModalOpen(true);
    if (!currentEvent) return;
    try {
      setIsLoadingAi(true);
      const res = await fetch("/api/ai/suggest-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: currentEvent.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || []);
        if (data.source) setAiSource(data.source);
      }
    } catch (err) {
      console.error("Failed to load vendor suggestions", err);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleAddSuggestedVendor = async (sug: any) => {
    if (!currentEvent) return;
    try {
      const res = await fetch(`/api/events/${currentEvent.id}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sug.name,
          category: sug.category,
          quotation: sug.estimatedBudget,
          bookingStatus: "Shortlisted",
          paymentStatus: "Unpaid",
          notes: `${sug.rationale} Negotiation: ${sug.negotiationTips}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to add suggested vendor");

      showToast({
        type: "success",
        title: "Vendor Added to Roster",
        message: `${sug.name} (${sug.category}) added as Shortlisted!`,
      });

      await refreshCurrentEvent();
      setAiSuggestions((prev) => prev.filter((item) => item.name !== sug.name));
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Add Failed",
        message: err.message,
      });
    }
  };

  // Filter & Search
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesCat =
        selectedCategory === "All" ||
        v.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [vendors, selectedCategory, searchQuery]);

  // Aggregate stats
  const totalQuotation = useMemo(
    () => vendors.reduce((acc, curr) => acc + (curr.finalQuotation || curr.quotation || 0), 0),
    [vendors]
  );
  const bookedCount = useMemo(
    () => vendors.filter((v) => v.bookingStatus === "Booked").length,
    [vendors]
  );

  // Handle Add Vendor
  const handleAddVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        name: formData.get("name"),
        category: formData.get("category"),
        contactPerson: formData.get("contactPerson") || null,
        phone: formData.get("phone") || null,
        email: formData.get("email") || null,
        quotation: Number(formData.get("quotation")) || 0,
        finalQuotation: formData.get("finalQuotation") ? Number(formData.get("finalQuotation")) : null,
        bookingStatus: formData.get("bookingStatus") || "Not contacted",
        paymentStatus: formData.get("paymentStatus") || "Unpaid",
        notes: formData.get("notes") || null,
        rating: formData.get("rating") ? Number(formData.get("rating")) : 4.8,
        website: formData.get("website") || null,
      };

      const res = await fetch(`/api/events/${currentEvent.id}/vendors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add vendor");

      showToast({
        type: "success",
        title: "Vendor Added",
        message: `${payload.name} has been added to your roster.`,
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

  // Handle Edit Vendor
  const handleEditVendor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent || !editingVendor) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        id: editingVendor.id,
        name: formData.get("name"),
        category: formData.get("category"),
        contactPerson: formData.get("contactPerson") || null,
        phone: formData.get("phone") || null,
        email: formData.get("email") || null,
        quotation: Number(formData.get("quotation")) || 0,
        finalQuotation: formData.get("finalQuotation") ? Number(formData.get("finalQuotation")) : null,
        bookingStatus: formData.get("bookingStatus"),
        paymentStatus: formData.get("paymentStatus"),
        notes: formData.get("notes") || null,
        rating: formData.get("rating") ? Number(formData.get("rating")) : null,
        website: formData.get("website") || null,
      };

      const res = await fetch(`/api/events/${currentEvent.id}/vendors`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update vendor");

      showToast({
        type: "success",
        title: "Vendor Updated",
        message: "Vendor details saved successfully.",
      });

      setEditingVendor(null);
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

  // Handle Delete Vendor
  const handleDeleteVendor = async (id: string) => {
    if (!currentEvent) return;

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/vendors?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete vendor");

      showToast({
        type: "success",
        title: "Vendor Removed",
        message: "Vendor was deleted from your event.",
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
            Partner Logistics
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mt-0.5">
            Vendor Management System
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Track quotes, contracts, and payment statuses for{" "}
            <strong>{currentEvent?.name || "your event"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleOpenAiSuggest}
            className="border border-plum-200"
          >
            <Sparkles className="w-4 h-4 mr-1 text-gold-600" />
            AI Vendor Sourcing
          </Button>

          <Button
            variant="gold"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-1 text-plum-950" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">
              Total Vendors
            </p>
            <h3 className="text-2xl font-bold text-stone-900 mt-1">
              {vendors.length}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Across {new Set(vendors.map((v) => v.category)).size} categories
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-plum-50 text-plum-800 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">
              Contracts Locked
            </p>
            <h3 className="text-2xl font-bold text-emerald-700 mt-1">
              {bookedCount} / {vendors.length}
            </h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
              Confirmed bookings
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-stone-500">
              Total Quotation Sum
            </p>
            <h3 className="text-2xl font-bold text-plum-900 mt-1">
              {formatCurrency(totalQuotation, currency)}
            </h3>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Committed vendor fees
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gold-50 text-gold-700 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors by name, contact, or category..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {VENDOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? "bg-plum-900 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors List Cards */}
      {filteredVendors.length === 0 ? (
        <Card className="p-12 text-center">
          <Users2 className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No vendors found
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            Add vendors or adjust your category search filter.
          </p>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Add New Vendor
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => {
            const hasSavings =
              vendor.finalQuotation &&
              vendor.finalQuotation < vendor.quotation;

            return (
              <Card
                key={vendor.id}
                className="p-6 flex flex-col justify-between hover:border-plum-200 hover:shadow-cardHover transition-all"
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-plum-50 text-plum-800 border border-plum-100">
                      {vendor.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        vendor.bookingStatus === "Booked"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : vendor.bookingStatus === "Negotiating"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : vendor.bookingStatus === "Shortlisted"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : vendor.bookingStatus === "Cancelled"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-stone-100 text-stone-600 border border-stone-200"
                      }`}
                    >
                      {vendor.bookingStatus}
                    </span>
                  </div>

                  {/* Name & Rating */}
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-1">
                      {vendor.name}
                    </h3>
                    {vendor.rating && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{vendor.rating}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1 mt-3 text-xs text-stone-600">
                    {vendor.contactPerson && (
                      <p className="font-medium text-stone-800 truncate">
                        Contact: {vendor.contactPerson}
                      </p>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-1.5 text-stone-500 truncate">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.website && (
                      <div className="flex items-center gap-1.5 text-plum-600 truncate">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <a
                          href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline text-[11px] font-medium"
                        >
                          {vendor.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Quotation Comparison */}
                  <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500">Initial Quote:</span>
                      <span className="font-medium text-stone-700">
                        {formatCurrency(vendor.quotation, currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-700 font-bold">Final / Agreed:</span>
                      <span className="font-bold text-plum-950">
                        {vendor.finalQuotation
                          ? formatCurrency(vendor.finalQuotation, currency)
                          : "Under negotiation"}
                      </span>
                    </div>

                    {hasSavings && (
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-600 pt-0.5">
                        <TrendingDown className="w-3 h-3" />
                        <span>
                          Negotiated savings:{" "}
                          {formatCurrency(
                            vendor.quotation - (vendor.finalQuotation || 0),
                            currency
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {vendor.notes && (
                    <p className="text-[11px] text-stone-500 mt-2 line-clamp-2 italic">
                      &ldquo;{vendor.notes}&rdquo;
                    </p>
                  )}
                </div>

                {/* Bottom Row */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      vendor.paymentStatus === "Fully Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : vendor.paymentStatus === "Advance Paid"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    Payment: {vendor.paymentStatus}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingVendor(vendor)}
                      title="Edit"
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteVendor(vendor.id)}
                      title="Delete"
                      className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Vendor"
          description="Log vendor contact, category, and quotation records."
        >
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Vendor / Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Royal Punjab Caterers"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {VENDOR_CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  placeholder="e.g. Harpreet Singh"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  placeholder="+91 98123 45678"
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
                  placeholder="vendor@planora.in"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Estimated Quotation ({currency})
                </label>
                <input
                  type="number"
                  name="quotation"
                  defaultValue="0"
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Final / Agreed Quotation ({currency})
                </label>
                <input
                  type="number"
                  name="finalQuotation"
                  min="0"
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Booking Status
                </label>
                <select
                  name="bookingStatus"
                  defaultValue="Not contacted"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {BOOKING_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  defaultValue="Unpaid"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {PAYMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Rating (1.0 - 5.0)
                </label>
                <input
                  type="number"
                  name="rating"
                  step="0.1"
                  min="1"
                  max="5"
                  defaultValue="4.8"
                  placeholder="e.g. 4.8"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Portfolio / Website URL
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://vendorportfolio.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Notes & Deliverables
              </label>
              <textarea
                name="notes"
                rows={2}
                placeholder="Deposit conditions, overtime hourly fee, dietary guarantees..."
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
                Save Vendor
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <Modal
          isOpen={!!editingVendor}
          onClose={() => setEditingVendor(null)}
          title="Edit Vendor"
          description="Update contact, contract quotes, or booking state."
        >
          <form onSubmit={handleEditVendor} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Vendor Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingVendor.name}
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  defaultValue={editingVendor.category}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {VENDOR_CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  defaultValue={editingVendor.contactPerson || ""}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingVendor.phone || ""}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingVendor.email || ""}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Quotation ({currency})
                </label>
                <input
                  type="number"
                  name="quotation"
                  defaultValue={editingVendor.quotation}
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Final Quotation ({currency})
                </label>
                <input
                  type="number"
                  name="finalQuotation"
                  defaultValue={editingVendor.finalQuotation || ""}
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Booking Status
                </label>
                <select
                  name="bookingStatus"
                  defaultValue={editingVendor.bookingStatus}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {BOOKING_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Payment Status
                </label>
                <select
                  name="paymentStatus"
                  defaultValue={editingVendor.paymentStatus}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {PAYMENT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Rating (1.0 - 5.0)
                </label>
                <input
                  type="number"
                  name="rating"
                  step="0.1"
                  min="1"
                  max="5"
                  defaultValue={editingVendor.rating || 4.8}
                  placeholder="e.g. 4.8"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Portfolio / Website URL
                </label>
                <input
                  type="url"
                  name="website"
                  defaultValue={editingVendor.website || ""}
                  placeholder="https://vendorportfolio.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={editingVendor.notes || ""}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingVendor(null)}
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

      {/* AI Vendor Sourcing Modal */}
      {isAiSuggestModalOpen && (
        <Modal
          isOpen={isAiSuggestModalOpen}
          onClose={() => setIsAiSuggestModalOpen(false)}
          title="AI Vendor Recommendations"
          description={`Smart sourcing tailored for ${currentEvent?.name || "your celebration"} (${currentEvent?.eventType || "Event"}, ${currentEvent?.guestCount || 0} guests)`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100">
              <span className="flex items-center gap-1 font-medium text-plum-900">
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                Sourcing Engine: <strong className="text-stone-800">{aiSource}</strong>
              </span>
              <span>Total Budget: <strong>{formatCurrency(currentEvent?.budget || 0, currency)}</strong></span>
            </div>

            {isLoadingAi ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-stone-500">
                <Loader2 className="w-8 h-8 animate-spin text-plum-600" />
                <p className="text-sm font-medium">Analyzing event requirements & discovering matched vendor specialists...</p>
              </div>
            ) : aiSuggestions.length === 0 ? (
              <div className="py-8 text-center text-stone-500 space-y-2">
                <p className="text-sm font-medium text-stone-700">All major vendor categories are already covered or event details are missing.</p>
                <p className="text-xs">Add custom vendor records above or re-run sourcing recommendations.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-stone-200 hover:border-plum-300 bg-white shadow-sm transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-stone-900 text-sm">{sug.name}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-plum-50 text-plum-800 border border-plum-200">
                            {sug.category}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1">{sug.rationale}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-stone-400 uppercase font-semibold block">Est. Allocation</span>
                        <span className="font-bold text-sm text-plum-950">
                          {formatCurrency(sug.estimatedBudget, currency)}
                        </span>
                      </div>
                    </div>

                    {sug.negotiationTips && (
                      <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                        <span className="shrink-0 font-bold">💡 Negotiation Tip:</span>
                        <span>{sug.negotiationTips}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddSuggestedVendor(sug)}
                        className="text-xs py-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1 text-gold-600" />
                        Add to Shortlist
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAiSuggest}
                disabled={isLoadingAi}
              >
                Regenerate Suggestions
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAiSuggestModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
