import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  EventInput,
  PlanOutput,
  PlanOutputSchema,
  AIPlanResponse,
  BudgetOptimizationResult,
  VendorSuggestion,
} from "./types";
import { generateDeterministicPlan } from "./fallbackPlanner";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export function hasValidGeminiKey(): boolean {
  return Boolean(
    GEMINI_API_KEY &&
      GEMINI_API_KEY.trim() !== "" &&
      !GEMINI_API_KEY.includes("YOUR_GEMINI_API_KEY")
  );
}

export async function generateEventPlan(input: EventInput): Promise<AIPlanResponse> {
  if (!hasValidGeminiKey()) {
    console.log("[AI Engine] No valid GEMINI_API_KEY found. Utilizing Planora Deterministic Planning Engine.");
    const fallback = generateDeterministicPlan(input);
    return {
      source: "deterministic_fallback",
      modelName: "Planora Local Planning Engine (Fallback)",
      plan: fallback,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const prompt = `
You are Planora AI, an elite event planner and financial architect for high-end celebrations and gatherings in India and globally.
Generate a structured, complete event plan for the following event details:

Event Name: ${input.name}
Event Type: ${input.eventType}
Event Date: ${input.date}
Location: ${input.location}
Guest Count: ${input.guestCount}
Total Budget: ₹${input.budget.toLocaleString("en-IN")}
Description / Dream Vision: ${input.description || "Not specified"}
Preferred Theme: ${input.preferredTheme || "Refined Luxury & Warmth"}
Indoor/Outdoor: ${input.indoorOutdoor || "Flexible"}
Dietary Preferences: ${input.dietaryPreferences || "Traditional & Modern multi-cuisine"}
Cultural Preferences: ${input.culturalPreferences || "Standard"}
Preferred Venue Type: ${input.venueType || "Banquet Hall & Lawn"}
Special Requirements: ${input.specialRequirements || "None"}
Number of Days: ${input.numberOfDays || 1}

Return ONLY a valid JSON object matching the following structure exactly without markdown code blocks:
{
  "event_summary": "Crisp 2-sentence summary of the vision and key highlights",
  "recommended_theme": "Theme title",
  "theme_description": "Detailed description of the visual style, colors (such as deep plum, champagne gold, ivory), and ambiance",
  "estimated_budget": ${input.budget},
  "budget_breakdown": [
    {
      "category": "Venue",
      "allocated_amount": 300000,
      "percentage": 25,
      "description": "Details of allocation"
    }
  ],
  "preparation_timeline": [
    {
      "title": "Milestone title",
      "timeframe": "e.g. 4 months before",
      "days_before_event": 120,
      "description": "Concrete steps",
      "time_of_day": "Morning"
    }
  ],
  "vendor_categories": [
    {
      "name": "Vendor title/type (e.g. Luxury Banquet Chattarpur)",
      "category": "Venue",
      "estimated_budget": 300000,
      "notes": "What to look for in contract"
    }
  ],
  "checklist": [
    {
      "title": "Task title",
      "category": "Venue",
      "priority": "High",
      "days_before_event": 90,
      "description": "Actionable task description"
    }
  ],
  "event_day_schedule": [
    {
      "time": "10:00 AM",
      "activity": "Activity name",
      "description": "Execution detail"
    }
  ],
  "personalized_ideas": [
    {
      "category": "Decoration",
      "title": "Idea title",
      "description": "Culturally sensitive, creative suggestion",
      "tags": ["Tag1", "Tag2"]
    }
  ],
  "recommendations": [
    "Expert recommendation 1",
    "Expert recommendation 2"
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    const validated = PlanOutputSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn("[AI Engine] Gemini response validation failed, falling back to local engine:", validated.error);
      const fallback = generateDeterministicPlan(input);
      return {
        source: "deterministic_fallback",
        modelName: "Planora Local Planning Engine (Fallback: Schema mismatch)",
        plan: fallback,
      };
    }

    return {
      source: "gemini",
      modelName: "Google Gemini 1.5 Flash",
      plan: validated.data,
    };
  } catch (err: any) {
    console.error("[AI Engine] Error invoking Gemini API:", err?.message || err);
    const fallback = generateDeterministicPlan(input);
    return {
      source: "deterministic_fallback",
      modelName: "Planora Local Planning Engine (Fallback: API error)",
      plan: fallback,
    };
  }
}

export async function optimizeBudgetWithAI(eventData: {
  name: string;
  eventType: string;
  budget: number;
  expenses: Array<{ category: string; description: string; estimatedAmount: number; actualAmount: number; paymentStatus: string }>;
}): Promise<BudgetOptimizationResult> {
  const totalBudget = Math.max(0, eventData.budget);
  const totalAllocated = eventData.expenses.reduce(
    (acc, curr) => acc + (curr.actualAmount > 0 ? curr.actualAmount : curr.estimatedAmount || 0),
    0
  );
  const remaining = totalBudget - totalAllocated;

  // Category totals map
  const catTotals: Record<string, number> = {};
  for (const exp of eventData.expenses) {
    const amt = exp.actualAmount > 0 ? exp.actualAmount : exp.estimatedAmount || 0;
    catTotals[exp.category] = (catTotals[exp.category] || 0) + amt;
  }

  // Standard benchmark allocation percentages for celebrations
  const benchmarkShares: Record<string, number> = {
    Venue: 0.30,
    Catering: 0.30,
    Decoration: 0.15,
    Photography: 0.10,
    Entertainment: 0.05,
    Clothing: 0.05,
    Invitations: 0.02,
    Transportation: 0.02,
    Miscellaneous: 0.01,
  };

  // Identify excessive categories
  const excessiveCategories: BudgetOptimizationResult["excessiveCategories"] = [];
  const alternativeDistributions: BudgetOptimizationResult["alternativeDistributions"] = [];

  const effectiveBudget = totalBudget > 0 ? totalBudget : totalAllocated;

  for (const [cat, amt] of Object.entries(catTotals)) {
    const benchmark = benchmarkShares[cat] || 0.05;
    const recommendedMax = Math.round(effectiveBudget * benchmark);
    const currentShare = effectiveBudget > 0 ? Math.round((amt / effectiveBudget) * 100) : 0;
    const benchmarkPct = Math.round(benchmark * 100);

    if (amt > recommendedMax * 1.15 && amt > 10000) {
      excessiveCategories.push({
        category: cat,
        currentAmount: amt,
        recommendedMax,
        notes: `Current allocation is ${currentShare}% of budget vs recommended benchmark of ${benchmarkPct}%. Consider reallocating the difference to savings or hospitality.`,
      });
    }

    // Propose an optimized alternative spending distribution
    const recommendedAmount = Math.min(amt, recommendedMax);
    alternativeDistributions.push({
      category: cat,
      currentAmount: amt,
      recommendedAmount: recommendedAmount > 0 ? recommendedAmount : amt,
      suggestedShare: benchmarkPct,
      reason:
        amt > recommendedMax
          ? `Cap ${cat} at ₹${recommendedMax.toLocaleString("en-IN")} (${benchmarkPct}%) to free up ₹${(amt - recommendedMax).toLocaleString("en-IN")}.`
          : `Maintained within the healthy ${benchmarkPct}% threshold.`,
    });
  }

  // If no Gemini key, return deterministic audit
  if (!hasValidGeminiKey()) {
    const highSpendCategory = [...eventData.expenses].sort(
      (a, b) => (b.actualAmount || b.estimatedAmount) - (a.actualAmount || a.estimatedAmount)
    )[0];
    const categoryName = highSpendCategory ? highSpendCategory.category : "Venue";

    return {
      source: "Planora Local Optimization Engine",
      summary: `Your planned expenditure is ₹${totalAllocated.toLocaleString("en-IN")} out of a total budget of ₹${totalBudget.toLocaleString("en-IN")}.`,
      savingsEstimate: Math.max(0, Math.round(totalAllocated * 0.08)),
      excessiveCategories,
      alternativeDistributions,
      suggestions: [
        `Re-evaluate ${categoryName} allocation: Compare multi-vendor package discounts to capture 8-12% in negotiated savings.`,
        "Catering plate optimization: Streamline dessert and appetizer counters to avoid buffet wastage while maintaining luxury presentation.",
        "Photography & Cinema: Contract combined candid photo + video crews rather than separate agencies to save up to 15% on logistics.",
        "Digital Invitation transition: Opt for interactive WhatsApp RSVP microsites to reduce physical printing and courier costs.",
      ],
      warnings:
        remaining < 0
          ? [`You are currently exceeding your total allocated budget by ₹${Math.abs(remaining).toLocaleString("en-IN")}. Consider trimming non-essential decor elements.`]
          : [`You have a healthy buffer of ₹${remaining.toLocaleString("en-IN")} remaining for last-minute contingencies.`],
      nonNegotiableAreas: [
        "Guest Catering Quality & Food Safety",
        "Key Moments Candid Photography & Video",
        "Core Venue Air-Conditioning & Power Backup",
      ],
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
Analyze the following event budget and expenses:
Event: ${eventData.name} (${eventData.eventType})
Total Budget: ₹${totalBudget}
Expenses: ${JSON.stringify(eventData.expenses)}

Provide realistic budget optimization advice in JSON format matching this exact structure:
{
  "summary": "Overview statement",
  "savingsEstimate": 50000,
  "excessiveCategories": [
    {
      "category": "Category",
      "currentAmount": 300000,
      "recommendedMax": 250000,
      "notes": "Reason"
    }
  ],
  "alternativeDistributions": [
    {
      "category": "Category",
      "currentAmount": 300000,
      "recommendedAmount": 250000,
      "suggestedShare": 25,
      "reason": "Rationale"
    }
  ],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "warnings": ["warning if any"],
  "nonNegotiableAreas": ["area 1", "area 2"]
}
Never recommend total spending greater than the total budget of ₹${totalBudget}.
`;

    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      source: "Google Gemini 1.5 Flash",
      summary: parsed.summary || `Budget audit completed for ${eventData.name}.`,
      savingsEstimate: Number(parsed.savingsEstimate) || Math.round(totalAllocated * 0.08),
      excessiveCategories: Array.isArray(parsed.excessiveCategories) ? parsed.excessiveCategories : excessiveCategories,
      alternativeDistributions: Array.isArray(parsed.alternativeDistributions) ? parsed.alternativeDistributions : alternativeDistributions,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      nonNegotiableAreas: Array.isArray(parsed.nonNegotiableAreas) ? parsed.nonNegotiableAreas : ["Catering Quality", "Key Moments Photography"],
    };
  } catch (e) {
    return {
      source: "Planora Local Optimization Engine (Fallback)",
      summary: "Local budget audit completed.",
      savingsEstimate: Math.max(0, Math.round(totalAllocated * 0.07)),
      excessiveCategories,
      alternativeDistributions,
      suggestions: [
        "Audit vendor quotations for overlapping service charges.",
        "Lock catering plate counts 10 days prior with a 5% floating cushion.",
        "Consolidate floral decor by reusing stage flowers for the reception buffet.",
      ],
      warnings: remaining < 0 ? [`Over budget by ₹${Math.abs(remaining).toLocaleString("en-IN")}`] : [],
      nonNegotiableAreas: ["Catering Quality", "Audio & Lighting Reliability"],
    };
  }
}

export async function suggestVendorsWithAI(eventData: {
  name: string;
  eventType: string;
  location: string;
  budget: number;
  guestCount: number;
  existingVendors: Array<{ category: string; name: string }>;
}): Promise<{ source: string; suggestions: VendorSuggestion[] }> {
  const existingCategories = new Set(eventData.existingVendors.map((v) => v.category.toLowerCase()));
  const totalBudget = Math.max(0, eventData.budget);

  // Deterministic vendor templates for Indian celebrations
  const fallbackTemplates: Record<string, VendorSuggestion> = {
    venue: {
      name: `Premium Heritage Banquet & Lawn (${eventData.location})`,
      category: "Venue",
      estimatedBudget: Math.round(totalBudget * 0.3),
      rationale: `Optimal capacity for ${eventData.guestCount} guests with both air-conditioned banquet hall and open outdoor lawn.`,
      negotiationTips: "Negotiate inclusion of basic stage lighting, backup diesel genset, and 4 complimentary green rooms.",
      keyQuestionsToAsk: [
        "Is there an in-house catering exclusivity clause?",
        "What is the hard curfew for outdoor music amplification?",
        "Are parking attendants and valet bundled in the hall rental?",
      ],
    },
    caterer: {
      name: `Royal Heritage Gourmet Feast (${eventData.location})`,
      category: "Caterer",
      estimatedBudget: Math.round(totalBudget * 0.3),
      rationale: `Multi-cuisine live catering featuring traditional regional specialties and global fusion for ${eventData.guestCount} guests.`,
      negotiationTips: "Contract for 90% guaranteed plate count with a 10% floating cushion on event night.",
      keyQuestionsToAsk: [
        "Do you provide uniform live counter chefs and serving staff?",
        "How are leftovers packaged and managed sustainably?",
        "Is mineral water and mocktail ice included in the plate price?",
      ],
    },
    decorator: {
      name: `Artisanal Floral & Stage Scenographers (${eventData.location})`,
      category: "Decorator",
      estimatedBudget: Math.round(totalBudget * 0.15),
      rationale: "Bespoke stage backdrop, mandap florals, fairy light pathways, and thematic photo-opportunity corners.",
      negotiationTips: "Reuse morning ceremony floral canopies for the evening buffet tables to save up to 20%.",
      keyQuestionsToAsk: [
        "Will 3D computer renders be shared before final signoff?",
        "Are exotic seasonal blooms sourced locally or imported?",
        "What time will the team begin teardown?",
      ],
    },
    photographer: {
      name: `Cinematic Candid Moments & Drone Crew (${eventData.location})`,
      category: "Photographer",
      estimatedBudget: Math.round(totalBudget * 0.1),
      rationale: "Comprehensive 2-day candid photo, 4K cinematic highlight teaser, and complete family portrait coverage.",
      negotiationTips: "Book both photo and video under one agency umbrella to save 15% on travel and crew fees.",
      keyQuestionsToAsk: [
        "How many photographers and cinematographers are on site?",
        "What are the delivery deadlines for raw photos and the edited teaser?",
        "Is drone flying permission handled by the team?",
      ],
    },
    dj: {
      name: `Pulse Sound & Live Folk Artists (${eventData.location})`,
      category: "DJ",
      estimatedBudget: Math.round(totalBudget * 0.05),
      rationale: "High-bass sound reinforcement, programmable moving-head beams, and live percussion/dhol troupe.",
      negotiationTips: "Verify if wireless microphone sets and guest speech podium audio are included without surcharge.",
      keyQuestionsToAsk: [
        "Do you take custom Spotify playlist requests beforehand?",
        "Is power amplification backup equipment on site?",
        "What is the overtime hourly rate past midnight?",
      ],
    },
  };

  // Find categories not yet booked
  const missingCategories = ["venue", "caterer", "decorator", "photographer", "dj"].filter(
    (c) => !existingCategories.has(c)
  );

  const fallbackSuggestions = (missingCategories.length > 0 ? missingCategories : ["venue", "caterer", "decorator"])
    .map((c) => fallbackTemplates[c] || fallbackTemplates.venue);

  if (!hasValidGeminiKey()) {
    return {
      source: "Planora Local Vendor Intelligence",
      suggestions: fallbackSuggestions,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `
Suggest tailored vendor sourcing options for:
Event: ${eventData.name} (${eventData.eventType}) in ${eventData.location}
Budget: ₹${totalBudget} for ${eventData.guestCount} guests
Currently tracked vendors: ${eventData.existingVendors.map((v) => `${v.category}: ${v.name}`).join(", ") || "None"}

Provide 3 tailored vendor recommendations for missing essential categories in JSON:
[
  {
    "name": "Vendor title/type (e.g. Royal Punjabi Caterers)",
    "category": "Caterer",
    "estimatedBudget": 300000,
    "rationale": "Why this fits guest count and style",
    "negotiationTips": "Practical tactics to save money",
    "keyQuestionsToAsk": ["Question 1", "Question 2"]
  }
]
`;

    const res = await model.generateContent(prompt);
    const text = res.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(text);

    return {
      source: "Google Gemini 1.5 Flash",
      suggestions: Array.isArray(parsed) && parsed.length > 0 ? parsed : fallbackSuggestions,
    };
  } catch (e) {
    return {
      source: "Planora Local Vendor Intelligence (Fallback)",
      suggestions: fallbackSuggestions,
    };
  }
}

export async function chatAssistantWithAI(params: {
  eventContext: any;
  history?: Array<{ role: string; content: string }>;
  userMessage?: string;
  message?: string;
}) {
  const eventContext = params.eventContext;
  const history = params.history || [];
  const userMessage = (params.userMessage || params.message || "").trim();

  if (!hasValidGeminiKey()) {
    // Smart contextual local conversational fallback
    const msgLower = userMessage.toLowerCase();
    const budget = eventContext?.budget || 0;
    const expenses = eventContext?.expenses || [];
    const vendors = eventContext?.vendors || [];
    const tasks = eventContext?.tasks || [];
    const timelines = eventContext?.timelineItems || [];
    const now = new Date();

    const spent = expenses.reduce(
      (acc: number, c: any) => acc + (c.actualAmount > 0 ? c.actualAmount : c.estimatedAmount || 0),
      0
    );
    const remaining = budget - spent;

    let reply = "";
    let suggestions = ["Show budget summary", "What tasks are overdue?", "Suggest catering ideas"];

    // 1. Catering specific questions
    if (msgLower.includes("cater") || msgLower.includes("food") || msgLower.includes("plate") || msgLower.includes("menu")) {
      const cateringExpenses = expenses.filter((e: any) => e.category.toLowerCase().includes("cater"));
      const catSpent = cateringExpenses.reduce((s: number, e: any) => s + (e.actualAmount || e.estimatedAmount || 0), 0);
      const catVendors = vendors.filter((v: any) => v.category.toLowerCase().includes("cater"));

      reply = `**Catering Breakdown for "${eventContext?.name || "your event"}":**\n` +
        `- **Total Catering Expenditure:** ₹${catSpent.toLocaleString("en-IN")}\n` +
        `- **Tracked Caterers:** ${catVendors.length > 0 ? catVendors.map((v: any) => `${v.name} (${v.bookingStatus})`).join(", ") : "No caterers contracted yet"}\n` +
        `- **Guest Allocation:** Estimated ${eventContext?.guestCount || 100} guests (~₹${Math.round(catSpent / (eventContext?.guestCount || 1)).toLocaleString("en-IN")} per guest).\n\n` +
        `💡 *Cost-Saving Tip:* Contract 90% of your confirmed RSVPs with a 10% floating cushion on event night to avoid paying for absent guests.`;
      suggestions = ["Optimize catering menu", "How much have I spent overall?", "View all vendors"];
    }
    // 2. Overdue or pending tasks
    else if (msgLower.includes("overdue") || (msgLower.includes("task") && msgLower.includes("pending"))) {
      const overdueTasks = tasks.filter((t: any) => !t.completed && t.dueDate && new Date(t.dueDate) < now);
      const pendingTasks = tasks.filter((t: any) => !t.completed);

      if (overdueTasks.length > 0) {
        reply = `⚠️ **You have ${overdueTasks.length} OVERDUE task${overdueTasks.length > 1 ? "s" : ""}:**\n` +
          overdueTasks.map((t: any) => `• **${t.title}** (${t.priority} priority - was due on ${new Date(t.dueDate).toLocaleDateString()})`).join("\n") +
          `\n\nYou also have ${pendingTasks.length - overdueTasks.length} other pending tasks on your checklist.`;
      } else {
        reply = `🎉 **Great news! You have 0 overdue tasks.**\n\nYou have **${pendingTasks.length} upcoming pending tasks**:\n` +
          pendingTasks.slice(0, 3).map((t: any) => `• **${t.title}** (${t.priority} priority - Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "Flexible"})`).join("\n");
      }
      suggestions = ["Add a new task", "Generate more checklist items", "Check budget status"];
    }
    // 3. Priority booking sequence ("What should I book first?")
    else if (msgLower.includes("book first") || msgLower.includes("what should i book") || msgLower.includes("priority booking")) {
      reply = `**Recommended Booking Sequence for ${eventContext?.eventType || "your event"}:**\n\n` +
        `1. **Venue (Lock Immediately):** Popular dates in ${eventContext?.location || "India"} book out 4-6 months ahead.\n` +
        `2. **Lead Caterer (3-4 months out):** Menu tastings and plate counts dictate roughly 30% of your total ₹${budget.toLocaleString("en-IN")} budget.\n` +
        `3. **Cinematic Photographer & Video (3 months out):** Top visual artists take only 1 wedding/event per date.\n` +
        `4. **Stage Decor & Florals (2 months out):** Finalize colors and 3D renders after venue floor plans are locked.\n` +
        `5. **DJ, Sound & Entertainment (6 weeks out):** Synchronize playlist cues and acoustic soundchecks.`;
      suggestions = ["Compare vendor quotes", "Add a new vendor", "Review timeline milestones"];
    }
    // 4. Decoration & Theme recommendations
    else if (msgLower.includes("decor") || msgLower.includes("theme") || msgLower.includes("floral") || msgLower.includes("light")) {
      reply = `**Personalized Decoration Concepts for "${eventContext?.theme || "Elegance & Celebration"}":**\n\n` +
        `• **Focal Canopy:** Use cascading white mogra, brass Diyas, and soft champagne gold drapery to create an inviting entrance.\n` +
        `• **Ambient Lighting:** Integrate warm Edison fairy bulbs with dimmable amber par-cans to complement the plum and ivory color scheme.\n` +
        `• **Interactive Memory Corner:** Set up an antique brass easel with polaroid snapshots and handwritten guest blessing cards.\n` +
        `• **Table Centerpieces:** Low-profile floral urns with floating golden tea-lights to keep sightlines clear for conversation.`;
      suggestions = ["Suggest alternatives for photography", "How to save ₹50,000?", "Check vendor quotes"];
    }
    // 5. Day-of schedule / Itinerary
    else if (msgLower.includes("schedule") || msgLower.includes("day of") || msgLower.includes("itinerary") || msgLower.includes("run-sheet")) {
      const daySchedule = timelines.filter((tl: any) => tl.timeOfDay && tl.timeOfDay !== "Morning" && tl.timeOfDay !== "All Day");
      reply = `**Run-Sheet Schedule for Event Day:**\n\n` +
        `• **09:00 AM:** Vendor Access & Stage/Floral Setup begins\n` +
        `• **01:00 PM:** Audio-Visual & Wireless Mic Soundcheck\n` +
        `• **04:30 PM:** Catering Live Counters & Welcome Mocktail Prep\n` +
        `• **06:30 PM:** Guest Welcome, Traditional Dhol / Acoustic entry\n` +
        `• **07:45 PM:** Main Ceremony & Highlights (Varmala / Cake Cutting / Speeches)\n` +
        `• **08:45 PM:** Grand Dinner Buffet opens with live dessert stations\n` +
        `• **10:30 PM:** Dance floor, party music, and farewell favors`;
      suggestions = ["Add milestone to timeline", "View full schedule", "What tasks are overdue?"];
    }
    // 6. Reduce budget / Cost savings
    else if (msgLower.includes("reduce") || msgLower.includes("save") || msgLower.includes("50,000") || msgLower.includes("cut")) {
      reply = `**Actionable Roadmap to Reduce ₹50,000+ from "${eventContext?.name || "your event"}":**\n\n` +
        `1. **Bundle Photography & Video (-₹20,000):** Contract a single 3-person team instead of separate agencies.\n` +
        `2. **Floral Canopy Repurposing (-₹15,000):** Transfer the morning floral arch elements to the evening reception stage backdrop.\n` +
        `3. **Dessert Counter Streamlining (-₹10,000):** Consolidate from 8 dessert varieties to 4 signature live items (e.g. Hot Jalebi with Rabdi & Kulfi).\n` +
        `4. **Digital Animated Save-the-Dates (-₹8,000):** Eliminate expensive physical couriers in favor of interactive WhatsApp RSVP microsites.\n\n` +
        `*Total achievable savings: ₹53,000 without compromising quality!*`;
      suggestions = ["Optimize my budget", "Which category has highest spend?", "View all expenses"];
    }
    // 7. General Budget / Spend queries
    else if (msgLower.includes("budget") || msgLower.includes("spend") || msgLower.includes("cost") || msgLower.includes("money")) {
      reply = `Here is your current financial status for "${eventContext?.name || "your event"}":\n` +
        `- **Total Budget:** ₹${budget.toLocaleString("en-IN")}\n` +
        `- **Committed / Spent:** ₹${spent.toLocaleString("en-IN")}\n` +
        `- **Remaining Reserve:** ₹${remaining.toLocaleString("en-IN")} (${budget > 0 ? Math.round((remaining / budget) * 100) : 0}% available)\n\n` +
        `You have ${expenses.length} categorized expense items recorded. Would you like to run the AI Budget Optimizer for category audits?`;
      suggestions = ["Optimize my budget", "How much have I spent on catering?", "View all expenses"];
    }
    // 8. General default greeting
    else {
      reply = `I am your Planora AI Assistant for **${eventContext?.name || "your celebration"}** (${eventContext?.eventType || "Celebration"} in ${eventContext?.location || "India"}).\n\n` +
        `I have active context of your ₹${budget.toLocaleString("en-IN")} budget, ${expenses.length} expenses, ${vendors.length} vendors, and ${tasks.length} checklist items.\n\n` +
        `How can I assist you right now? You can ask about budget savings, overdue tasks, vendor quotations, or run-sheet schedules.`;
    }

    return {
      source: "Planora Local Assistant (Fallback)",
      reply,
      suggestions,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const contextPrompt = `
You are the dedicated Planora AI Event Planning Assistant.
Current Active Event Data from database:
- Name: ${eventContext?.name}
- Type: ${eventContext?.eventType}
- Date: ${eventContext?.date}
- Location: ${eventContext?.location}
- Guests: ${eventContext?.guestCount}
- Total Budget: ₹${eventContext?.budget?.toLocaleString("en-IN")}
- Theme: ${eventContext?.theme}
- Expenses: ${JSON.stringify(eventContext?.expenses?.map((e: any) => ({ cat: e.category, est: e.estimatedAmount, act: e.actualAmount, status: e.paymentStatus })) || [])}
- Vendors: ${JSON.stringify(eventContext?.vendors?.map((v: any) => ({ name: v.name, cat: v.category, quote: v.quotation, final: v.finalQuotation, status: v.bookingStatus })) || [])}
- Tasks: ${JSON.stringify(eventContext?.tasks?.map((t: any) => ({ title: t.title, priority: t.priority, completed: t.completed, due: t.dueDate })) || [])}

Rules:
1. Always use actual facts from the provided event data. Never hallucinate bookings or expenses that do not exist in the context.
2. Be encouraging, concise, actionable, and culturally tuned to Indian and modern celebrations.
3. Use ₹ INR currency format.
`;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: contextPrompt }] },
        { role: "model", parts: [{ text: "Understood. I have loaded all real event parameters and am ready to assist specifically with this celebration." }] },
        ...history.slice(-6).map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
        })),
      ],
    });

    const res = await chat.sendMessage(userMessage);
    const replyText = res.response.text();

    return {
      source: "Google Gemini 1.5 Flash",
      reply: replyText,
      suggestions: [
        "How can I save ₹50,000 on catering?",
        "What tasks are priority this week?",
        "Suggest decor touches for our theme",
      ],
    };
  } catch (err: any) {
    console.error("[AI Chat] Gemini API error:", err);
    return {
      source: "Planora Local Assistant (Fallback: Error)",
      reply: `I encountered an issue communicating with the AI service. However, based on your local event records, your budget is ₹${(eventContext?.budget || 0).toLocaleString("en-IN")} with ${(eventContext?.tasks || []).length} tasks tracked. How can I help you directly?`,
      suggestions: ["Check budget", "Review tasks", "View vendors"],
    };
  }
}

export async function generateIdeasWithAI(params: {
  eventName: string;
  eventType: string;
  theme?: string;
  guestCount?: number;
  location?: string;
  category?: string;
  existingIdeas?: string[];
}) {
  const { eventName, eventType, theme, guestCount, location, category } = params;
  const existingLower = (params.existingIdeas || []).map((t) => t.toLowerCase());

  const curatedIdeas = [
    {
      category: "Decoration",
      title: "Champagne Mirrored Aisle with Hanging Mogra Chandeliers",
      description: "Create an ethereal walkway with reflective mirrored runners, brass floor lanterns, and cascading natural jasmine chandeliers.",
      tags: "Floral, Lighting, Royal",
    },
    {
      category: "Catering",
      title: "Artisanal Chai Bar & Live Jalebi-Rabdi Station",
      description: "An evening interactive tea-lounge serving Kashmiri Kahwa, Kulhad Masala Chai, and piping hot kesar jalebi with malai rabdi.",
      tags: "Food, Tea Lounge, Traditional",
    },
    {
      category: "Entertainment",
      title: "Live Flute & Santoor Twilight Welcome",
      description: "Welcome arriving guests with soothing classical Indian acoustic ragas before transitioning into celebratory dhol beats.",
      tags: "Music, Live Ragas, Ambience",
    },
    {
      category: "Guest Experience",
      title: "Bespoke Ittar (Perfume) Bar & Silk Stoles",
      description: "A luxury fragrance counter where guests blend their own customized organic floral attar vials as a personalized keepsake.",
      tags: "Favors, Interactive, Luxury",
    },
    {
      category: "Photography Concepts",
      title: "Sunset Golden Hour Silhouette Couple Shoot",
      description: "Coordinate a 20-minute private twilight portrait session against backlit brass lattice or illuminated open lawn fountains.",
      tags: "Photos, Drone, Golden Hour",
    },
    {
      category: "Return Gifts",
      title: "Curated Artisanal Brass Spice & Mithai Hampers",
      description: "Handcrafted brass containers filled with organic Kashmiri saffron, roasted nuts, and heritage Besan Laddoos wrapped in handloom fabric.",
      tags: "Favors, Heritage, Keepsake",
    },
  ];

  if (hasValidGeminiKey()) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `
Generate 3 unique, culturally sensitive, personalized event ideas for:
Event: ${eventName} (${eventType}) in ${location || "India"}
Guest Count: ${guestCount || 100}
Theme: ${theme || "Celebration"}
${category && category !== "All" ? `Focus specifically on category: ${category}` : ""}

Return JSON array:
[
  {
    "category": "Decoration" | "Catering" | "Entertainment" | "Guest Experience" | "Photography Concepts" | "Return Gifts",
    "title": "Creative Title",
    "description": "2-sentence inspiring description with actionable execution tips",
    "tags": "Tag1, Tag2"
  }
]
`;
      const res = await model.generateContent(prompt);
      const text = res.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item: any) => ({
          category: item.category || "General",
          title: item.title,
          description: item.description,
          tags: typeof item.tags === "string" ? item.tags : Array.isArray(item.tags) ? item.tags.join(", ") : "AI Idea",
        }));
      }
    } catch (err) {
      console.warn("Gemini idea generation failed, falling back to curated library", err);
    }
  }

  const filtered = curatedIdeas.filter(
    (item) =>
      (!category || category === "All" || item.category.toLowerCase() === category.toLowerCase()) &&
      !existingLower.some((t) => t.includes(item.title.toLowerCase().slice(0, 15)))
  );

  return filtered.length > 0 ? filtered : curatedIdeas.slice(0, 3);
}
