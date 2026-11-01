"use client";

import React, { useState, useMemo } from "react";
import {
  CheckSquare,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  Edit2,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useEvent, TaskItem } from "@/context/EventContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatRelativeDays } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const PRIORITIES = ["High", "Medium", "Low"];

const CATEGORIES = [
  "General",
  "Venue",
  "Catering",
  "Decoration",
  "Invitations",
  "Photography",
  "Outfits",
  "Favors",
  "Logistics",
  "Finance",
  "Operations",
];

export default function ChecklistPage() {
  const { currentEvent, refreshCurrentEvent } = useEvent();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "created">("dueDate");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tasks = currentEvent?.tasks || [];
  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks]);
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (statusFilter === "pending") return !t.completed;
        if (statusFilter === "completed") return t.completed;
        return true;
      })
      .filter((t) => {
        if (priorityFilter === "all") return true;
        return t.priority.toLowerCase() === priorityFilter.toLowerCase();
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          const weight = { High: 3, Medium: 2, Low: 1 };
          return (weight[b.priority as keyof typeof weight] || 0) - (weight[a.priority as keyof typeof weight] || 0);
        }
        if (sortBy === "dueDate") {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks, statusFilter, priorityFilter, sortBy]);

  // Handle Toggle Task
  const handleToggleTask = async (task: TaskItem) => {
    if (!currentEvent) return;

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          completed: !task.completed,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle task");

      await refreshCurrentEvent();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Toggle Failed",
        message: err.message,
      });
    }
  };

  // Handle Add Task
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        dueDate: formData.get("dueDate") || null,
        completed: false,
      };

      const res = await fetch(`/api/events/${currentEvent.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to add task");

      showToast({
        type: "success",
        title: "Task Created",
        message: "New action item added to your checklist.",
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

  // Handle Edit Task
  const handleEditTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentEvent || !editingTask) return;

    try {
      setIsSubmitting(true);
      const form = e.currentTarget;
      const formData = new FormData(form);

      const payload = {
        id: editingTask.id,
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        priority: formData.get("priority"),
        dueDate: formData.get("dueDate") || null,
      };

      const res = await fetch(`/api/events/${currentEvent.id}/tasks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update task");

      showToast({
        type: "success",
        title: "Task Updated",
        message: "Checklist item was updated.",
      });

      setEditingTask(null);
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

  // Handle Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!currentEvent) return;

    try {
      const res = await fetch(`/api/events/${currentEvent.id}/tasks?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete task");

      showToast({
        type: "success",
        title: "Task Deleted",
        message: "Checklist item was removed.",
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

  // Handle AI Generate More Tasks
  const handleGenerateMoreTasks = async () => {
    if (!currentEvent) return;

    try {
      setIsGeneratingMore(true);
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: currentEvent.id }),
      });

      if (!res.ok) throw new Error("Failed to generate additional tasks");

      const data = await res.json();

      showToast({
        type: "success",
        title: "AI Tasks Generated",
        message: `Added ${data.createdCount} new relevant checklist tasks!`,
      });

      await refreshCurrentEvent();
    } catch (err: any) {
      showToast({
        type: "error",
        title: "AI Error",
        message: err.message,
      });
    } finally {
      setIsGeneratingMore(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-gold-600 uppercase tracking-widest">
            Action Items
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mt-0.5">
            AI-Generated Checklist
          </h1>
          <p className="text-xs md:text-sm text-stone-500 mt-0.5">
            Manage preparation tasks for <strong>{currentEvent?.name || "your event"}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            isLoading={isGeneratingMore}
            onClick={handleGenerateMoreTasks}
            className="border border-plum-200"
          >
            <Sparkles className="w-4 h-4 mr-1 text-gold-600" />
            Generate More Tasks
          </Button>

          <Button
            variant="gold"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4 mr-1 text-plum-950" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-plum-700" />
            <span className="text-stone-800">
              Task Completion: {progressPercent}%
            </span>
          </div>
          <span className="text-stone-500">
            {completedCount} of {tasks.length} tasks completed
          </span>
        </div>
        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-plum-600 to-plum-900 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Filter and Sorting Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 border-b md:border-b-0 pb-2 md:pb-0">
          {(["all", "pending", "completed"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-plum-900 text-white shadow-sm"
                  : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {st} ({st === "all" ? tasks.length : st === "pending" ? tasks.length - completedCount : completedCount})
            </button>
          ))}
        </div>

        {/* Priority & Sorting */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-plum-400"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1 text-xs text-stone-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 text-xs rounded-lg border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-plum-400"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="created">Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            No tasks matching criteria
          </h3>
          <p className="text-xs text-stone-500 mt-1 mb-6">
            Clear filters or generate new suggestions using AI.
          </p>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            Add New Task
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            return (
              <Card
                key={task.id}
                className={`p-4 transition-all duration-200 flex items-start gap-3.5 ${
                  task.completed
                    ? "bg-stone-50/80 border-stone-200/60 opacity-75"
                    : "hover:border-plum-200 hover:shadow-card"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleTask(task)}
                  className="mt-0.5 shrink-0 text-stone-400 hover:text-plum-800 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Circle className="w-5 h-5 hover:text-plum-600" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {task.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        task.priority === "High"
                          ? "bg-rose-100 text-rose-800"
                          : task.priority === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {task.priority} Priority
                    </span>

                    {task.dueDate && (
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3 text-stone-400" />
                        Due {formatDate(task.dueDate)} ({formatRelativeDays(task.dueDate)})
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm font-bold text-stone-900 ${
                      task.completed ? "line-through text-stone-400 font-normal" : ""
                    }`}
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p
                      className={`text-xs text-stone-600 mt-1 leading-relaxed ${
                        task.completed ? "line-through text-stone-400" : ""
                      }`}
                    >
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingTask(task)}
                    title="Edit"
                    className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    title="Delete"
                    className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Task"
          description="Create a checklist item with priority and due date."
        >
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Confirm guest count with caterer"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  defaultValue="General"
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
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue="Medium"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description / Action Notes
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Details, phone numbers, or specific checklist criteria..."
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
                Create Task
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          title="Edit Task"
          description="Update task details or urgency."
        >
          <form onSubmit={handleEditTask} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Task Title
              </label>
              <input
                type="text"
                name="title"
                defaultValue={editingTask.title}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  defaultValue={editingTask.category}
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
                  Priority
                </label>
                <select
                  name="priority"
                  defaultValue={editingTask.priority}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400 bg-white"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                defaultValue={editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split("T")[0] : ""}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                defaultValue={editingTask.description || ""}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-plum-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingTask(null)}
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
