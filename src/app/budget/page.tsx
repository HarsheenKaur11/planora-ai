"use client";

import React, { useState, useMemo } from "react";
import {
  PieChart as PieIcon,
  BarChart3,
  PlusCircle,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Trash2,
  Edit2,
  DollarSign,
  Receipt,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useEvent, ExpenseItem } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const CATEGORIES = [
  "Venue",
  "Catering",
  "Decoration",
  "Photography",
  "Videography",
  "Entertainment",
  "Clothing",
  "Transportation",
  "Accommodation",
  "Invitations",
  "Gifts",
  "Miscellaneous",
];

const PAYMENT_STATUSES = ["Pending", "Partially Paid", "Paid", "Overdue"];

const COLOR_PALETTE = [
  "#2C1242", // Deep Plum
  "#D4AF37", // Champagne Gold
  "#7B419E", // Royal Purple
  "#059669", // Emerald
  "#D97706", // Amber
  "#2563EB", // Blue
  "#DC2626", // Rose
  "#8B5CF6", // Violet
  "#0D9488", // Teal
  "#DB2777", // Pink
  "#475569", // Slate
  "#B45309", // Warm Brown
];

export default function BudgetPage() {
  const { currentEvent, refreshCurrentEvent, currency } = useEvent();
  const { showToast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenses = currentEvent?.expenses || [];
  const totalBudget = currentEvent?.budget || 0;

  // Calculations
  const totalEstimated = useMemo(
    () => expenses.reduce((acc, curr) => acc + (curr.estimatedAmount || 0), 0),
    [expenses]
  );

  const totalActual = useMemo(
    () => expenses.reduce((acc, curr) => acc + (curr.actualAmount || 0), 0),
    [expenses]
  );

  // Planned expenditure: uses actual if entered (> 0), else estimated
  const plannedExpenditure = useMemo(
    () => expenses.reduce((acc, curr) => acc + (curr.actualAmount > 0 ? curr.actualAmount : curr.estimatedAmount), 0),
    [expenses]
  );

  const remainingBalance = totalBudget - plannedExpenditure;
  const utilizationPercentage = totalBudget > 0 ? Math.min(100, Math.round((plannedExpenditure / totalBudget) * 100)) : 0;

  // Chart data: Grouped by category
  const categoryData = useMemo(() => {
    const map: Record<string, { category: string; estimated: number; actual: number }> = {};
    for (const exp of expenses) {
      if (!map[exp.category]) {
        map[exp.category] = { category: exp.category, estimated: 0, actual: 0 };
      }
      map[exp.category].estimated += exp.estimatedAmount || 0;
      map[exp.category].actual += exp.actualAmount || 0;
    }
    return Object.values(map);
  }, [expenses]);

  const pieData = useMemo(() => {
    return categoryData
      .map((c) => ({
        name: c.category,
        value: c.actual > 0 ? c.actual : c.estimated,
      }))
      .filter((item) => item.value > 0);
  }, [categoryData]);

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        category: formData.get("category"),
        description: formData.get("description"),
        estimatedAmount: Number(formData.get("estimatedAmount")),
        actualAmount: Number(formData.get("actualAmount")),
        paymentStatus: formData.get("paymentStatus"),
      };

      if (payload.estimatedAmount < 0 || payload.actualAmount < 0) {
        throw new Error("Expense amounts cannot be negative");
      }

      const res = await fetch(`/api/events/${currentEvent.id}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add expense");

      showToast({
        type: "success",
        title: "Expense Added",
        message: `${payload.category} expense has been recorded.`,
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

  // Handle Edit Expense
  const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent || !editingExpense) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        id: editingExpense.id,
        category: formData.get("category"),
        description: formData.get("description"),
        estimatedAmount: Number(formData.get("estimatedAmount")),
        actualAmount: Number(formData.get("actualAmount")),
        paymentStatus: formData.get("paymentStatus"),
      };

      if (payload.estimatedAmount < 0 || payload.actualAmount < 0) {
        throw new Error("Expense amounts cannot be negative");
      }

      const res = await fetch(`/api/events/${currentEvent.id}/expenses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update expense");

      showToast({
        type: "success",
        title: "Expense Updated",
        message: "Expense record was updated.",
      });

      setEditingExpense(null);
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

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!currentEvent) return;

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/expenses?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete expense");

      showToast({
        type: "success",
        title: "Expense Deleted",
        message: "The expense was removed.",
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

  // Handle Optimize Budget AI
  const handleOptimizeBudget = async () => {
    if (!currentEvent) return;

    try {
      setIsOptimizing(true);
      setIsOptimizeModalOpen(true);

      const res = await fetch("/api/ai/optimize-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: currentEvent.id }),
      });

      if (!res.ok) throw new Error("Optimization request failed");

      const data = await res.json();
      setOptimizationResult(data);
    } catch (err: any) {
      showToast({
        type: "error",
        title: "AI Optimization Error",
        message: err.message,
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
            Financial Management
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mt-0.5">
            Smart Budget Planner
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Event: <strong>{currentEvent?.name || "No active event"}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleOptimizeBudget}
            className="border border-plum-200"
          >
            <Sparkles className="w-4 h-4 mr-1 text-gold-600" />
            Optimize My Budget
          </Button>

          <Button
            variant="gold"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-1 text-plum-950" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* 4 Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Total Allocated Budget
          </p>
          <h3 className="text-2xl font-bold text-stone-900 mt-1">
            {formatCurrency(totalBudget, currency)}
          </h3>
          <p className="text-[11px] text-stone-400 mt-1">Locked event cap</p>
        </Card>

        {/* Planned Expenditure */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Planned Expenditure
          </p>
          <h3 className="text-2xl font-bold text-plum-900 mt-1">
            {formatCurrency(plannedExpenditure, currency)}
          </h3>
          <p className="text-[11px] text-plum-600 mt-1 font-medium">
            {utilizationPercentage}% of total budget
          </p>
        </Card>

        {/* Actual Paid Out */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Actual Paid Out
          </p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">
            {formatCurrency(totalActual, currency)}
          </h3>
          <p className="text-[11px] text-stone-400 mt-1">
            Settled with vendors so far
          </p>
        </Card>

        {/* Remaining Balance */}
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Remaining Balance
          </p>
          <h3
            className={`text-2xl font-bold mt-1 ${
              remainingBalance < 0 ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {formatCurrency(remainingBalance, currency)}
          </h3>
          <p className="text-[11px] mt-1 font-medium">
            {remainingBalance < 0
              ? "Exceeding budget limit!"
              : "Available reserve balance"}
          </p>
        </Card>
      </div>

      {/* Budget Utilization Progress Bar */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-2">
          <span>Overall Budget Utilization: {utilizationPercentage}%</span>
          <span>
            {formatCurrency(plannedExpenditure, currency)} /{" "}
            {formatCurrency(totalBudget, currency)}
          </span>
        </div>
        <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              utilizationPercentage > 95
                ? "bg-rose-500"
                : utilizationPercentage > 80
                ? "bg-amber-500"
                : "bg-gradient-to-r from-plum-600 via-plum-700 to-plum-900"
            }`}
            style={{ width: `${Math.min(100, utilizationPercentage)}%` }}
          />
        </div>
      </Card>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Share Donut Chart */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-plum-700" />
              Category Allocation Breakdown
            </CardTitle>
          </CardHeader>

          {pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400 italic">
              No expense allocations recorded yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [
                      formatCurrency(Number(value), currency),
                      "Amount",
                    ]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Estimated vs Actual Bar Chart */}
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-base font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gold-600" />
              Estimated vs Actual Expenditure
            </CardTitle>
          </CardHeader>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400 italic">
              No category data available to compare.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `₹${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [
                      formatCurrency(Number(val), currency),
                    ]}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                  />
                  <Bar
                    dataKey="estimated"
                    name="Estimated"
                    fill="#B792DE"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="actual"
                    name="Actual Spent"
                    fill="#2C1242"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Expenses History Table */}
      <Card className="p-6">
        <CardHeader>
          <div>
            <CardTitle className="text-base font-bold text-stone-900">
              Detailed Expense Items ({expenses.length})
            </CardTitle>
            <p className="text-xs text-stone-500">
              Manage quotations, payments, and track vendor financial commitments.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Add New Row
          </Button>
        </CardHeader>

        {expenses.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-xs">
            No expenses found. Click &quot;Add Expense&quot; above to log your first quotation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px] bg-stone-50/50">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Estimated</th>
                  <th className="py-3 px-4 text-right">Actual Spent</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-plum-50/30 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-700 max-w-xs truncate">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-stone-600">
                      {formatCurrency(exp.estimatedAmount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-stone-900">
                      {exp.actualAmount > 0
                        ? formatCurrency(exp.actualAmount, currency)
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          exp.paymentStatus === "Paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : exp.paymentStatus === "Partially Paid"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : exp.paymentStatus === "Overdue"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-stone-100 text-stone-600 border border-stone-200"
                        }`}
                      >
                        {exp.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          title="Edit"
                          className="p-1 rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          title="Delete"
                          className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Expense"
          description="Record a quotation, vendor fee, or purchase item."
        >
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category
              </label>
              <select
                name="category"
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description / Vendor Note
              </label>
              <input
                type="text"
                name="description"
                placeholder="e.g. Lawn advance deposit, bridal hair styling"
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Estimated Amount ({currency})
                </label>
                <input
                  type="number"
                  name="estimatedAmount"
                  defaultValue="0"
                  min="0"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Actual Amount Paid ({currency})
                </label>
                <input
                  type="number"
                  name="actualAmount"
                  defaultValue="0"
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Payment Status
              </label>
              <select
                name="paymentStatus"
                defaultValue="Pending"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {PAYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
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
                Save Expense
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <Modal
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          title="Edit Expense"
          description="Update quotations or settled actual amounts."
        >
          <form onSubmit={handleEditExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category
              </label>
              <select
                name="category"
                defaultValue={editingExpense.category}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description
              </label>
              <input
                type="text"
                name="description"
                defaultValue={editingExpense.description}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Estimated Amount ({currency})
                </label>
                <input
                  type="number"
                  name="estimatedAmount"
                  defaultValue={editingExpense.estimatedAmount}
                  min="0"
                  required
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Actual Amount Paid ({currency})
                </label>
                <input
                  type="number"
                  name="actualAmount"
                  defaultValue={editingExpense.actualAmount}
                  min="0"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Payment Status
              </label>
              <select
                name="paymentStatus"
                defaultValue={editingExpense.paymentStatus}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
              >
                {PAYMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingExpense(null)}
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

      {/* AI Budget Optimization Modal */}
      {isOptimizeModalOpen && (
        <Modal
          isOpen={isOptimizeModalOpen}
          onClose={() => setIsOptimizeModalOpen(false)}
          title="AI Budget Optimizer"
          description="Intelligent financial audit identifying savings and non-negotiables."
          maxWidth="xl"
        >
          {isOptimizing ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-plum-200 border-t-plum-800 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-stone-800">
                Analyzing category distributions and vendor margins...
              </p>
            </div>
          ) : optimizationResult ? (
            <div className="space-y-5">
              <div className="p-3.5 rounded-xl bg-plum-50 border border-plum-200 text-xs text-plum-900 flex items-center justify-between">
                <span>
                  Source: <strong>{optimizationResult.source}</strong>
                </span>
                <span className="font-bold text-gold-700 bg-white px-2 py-0.5 rounded border border-gold-300">
                  Est. Savings: {formatCurrency(optimizationResult.savingsEstimate, currency)}
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed font-medium">
                {optimizationResult.summary}
              </p>

              {/* Excessive Categories Audit */}
              {optimizationResult.excessiveCategories && optimizationResult.excessiveCategories.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Over-Allocated / Excessive Categories Identified
                  </h4>
                  <div className="space-y-2">
                    {optimizationResult.excessiveCategories.map((exc: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>{exc.category}</span>
                          <span className="text-rose-700">
                            Over by ~{formatCurrency(exc.excessAmount, currency)} ({exc.currentPercentage}% vs {exc.standardPercentage}% benchmark)
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-800 leading-relaxed">{exc.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Recommended Distributions */}
              {optimizationResult.alternativeDistributions && optimizationResult.alternativeDistributions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-plum-950 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-plum-700" />
                    Recommended Re-Distribution Model
                  </h4>
                  <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Current Spend</th>
                          <th className="py-2 px-3">Recommended</th>
                          <th className="py-2 px-3">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700 bg-white">
                        {optimizationResult.alternativeDistributions.map((dist: any, i: number) => (
                          <tr key={i} className="hover:bg-stone-50/60">
                            <td className="py-2 px-3 font-medium text-stone-900">{dist.category}</td>
                            <td className="py-2 px-3 text-stone-600">{formatCurrency(dist.currentAmount, currency)}</td>
                            <td className="py-2 px-3 font-semibold text-plum-900">{formatCurrency(dist.recommendedAmount, currency)}</td>
                            <td className={`py-2 px-3 font-bold ${dist.difference < 0 ? "text-emerald-600" : dist.difference > 0 ? "text-blue-600" : "text-stone-500"}`}>
                              {dist.difference < 0 ? `-${formatCurrency(Math.abs(dist.difference), currency)}` : dist.difference > 0 ? `+${formatCurrency(dist.difference, currency)}` : "Optimal"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Tactical Savings Opportunities
                </h4>
                <div className="space-y-2">
                  {optimizationResult.suggestions?.map((sug: string, i: number) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-stone-700 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-negotiable areas */}
              {optimizationResult.nonNegotiableAreas && (
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-plum-700" />
                    Areas to Avoid Compromising (Quality & Experience)
                  </h4>
                  <ul className="list-disc list-inside text-xs text-stone-600 space-y-1">
                    {optimizationResult.nonNegotiableAreas.map((area: string, i: number) => (
                      <li key={i}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {optimizationResult.warnings && optimizationResult.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  {optimizationResult.warnings.map((w: string, i: number) => (
                    <p key={i}>⚠️ {w}</p>
                  ))}
                </div>
              )}

              <div className="p-2.5 rounded-lg bg-stone-100 text-[11px] text-stone-500">
                ℹ️ <em>Note:</em> Optimization estimates represent market guidance. Always cross-check signed vendor contracts and local rates prior to re-allocating funds.
              </div>

              <div className="flex justify-end pt-3 border-t border-stone-100">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsOptimizeModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
}
