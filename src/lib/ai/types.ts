import { z } from "zod";

export const EventInputSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  eventType: z.enum([
    "Wedding",
    "Birthday",
    "Anniversary",
    "Engagement",
    "Baby shower",
    "Community gathering",
    "Festival",
    "Corporate event",
    "Other",
  ]),
  date: z.string().min(1, "Event date is required"),
  location: z.string().min(2, "Location is required"),
  guestCount: z.number().int().positive("Guest count must be at least 1"),
  budget: z.number().nonnegative("Budget must be a non-negative number"),
  description: z.string().optional(),
  preferredTheme: z.string().optional(),
  indoorOutdoor: z.enum(["Indoor", "Outdoor", "Both", "Flexible"]).optional(),
  dietaryPreferences: z.string().optional(),
  culturalPreferences: z.string().optional(),
  venueType: z.string().optional(),
  specialRequirements: z.string().optional(),
  numberOfDays: z.number().int().positive().optional().default(1),
});

export type EventInput = z.infer<typeof EventInputSchema>;

export const PlanOutputSchema = z.object({
  event_summary: z.string(),
  recommended_theme: z.string(),
  theme_description: z.string(),
  estimated_budget: z.number(),
  budget_breakdown: z.array(
    z.object({
      category: z.string(),
      allocated_amount: z.number(),
      percentage: z.number(),
      description: z.string(),
    })
  ),
  preparation_timeline: z.array(
    z.object({
      title: z.string(),
      timeframe: z.string(),
      days_before_event: z.number(),
      description: z.string(),
      time_of_day: z.string().optional(),
    })
  ),
  vendor_categories: z.array(
    z.object({
      name: z.string(),
      category: z.string(),
      estimated_budget: z.number(),
      notes: z.string(),
    })
  ),
  checklist: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      days_before_event: z.number(),
      description: z.string(),
    })
  ),
  event_day_schedule: z.array(
    z.object({
      time: z.string(),
      activity: z.string(),
      description: z.string(),
    })
  ),
  personalized_ideas: z.array(
    z.object({
      category: z.string(),
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).optional(),
    })
  ),
  recommendations: z.array(z.string()),
});

export type PlanOutput = z.infer<typeof PlanOutputSchema>;

export interface AIPlanResponse {
  source: "gemini" | "deterministic_fallback";
  modelName: string;
  plan: PlanOutput;
}

export interface AlternativeDistribution {
  category: string;
  currentAmount: number;
  recommendedAmount: number;
  suggestedShare: number;
  reason: string;
}

export interface ExcessiveCategory {
  category: string;
  currentAmount: number;
  recommendedMax: number;
  notes: string;
}

export interface BudgetOptimizationResult {
  source: string;
  summary: string;
  savingsEstimate: number;
  excessiveCategories: ExcessiveCategory[];
  alternativeDistributions: AlternativeDistribution[];
  suggestions: string[];
  warnings: string[];
  nonNegotiableAreas: string[];
}

export interface VendorSuggestion {
  name: string;
  category: string;
  estimatedBudget: number;
  rationale: string;
  negotiationTips: string;
  keyQuestionsToAsk: string[];
}
