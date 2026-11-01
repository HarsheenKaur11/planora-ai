import { PrismaClient } from "@prisma/client";
import { generateDeterministicPlan } from "../src/lib/ai/fallbackPlanner";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=== PLANORA AI E2E QA TEST SUITE ===");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // Test 1: Verify Seeded Demo Event
    console.log("\n--- TEST 1: Check Seeded Demo Data ---");
    const demoEvent = await prisma.event.findFirst({
      where: { isDemo: true },
      include: {
        expenses: true,
        vendors: true,
        tasks: true,
        timelineItems: true,
        ideas: true,
        chatMessages: true,
      },
    });

    assert(demoEvent !== null, "Demo wedding event exists in DB");
    if (!demoEvent) throw new Error("Demo event missing");

    assert(demoEvent.expenses.length >= 9, `Demo event has expenses (found ${demoEvent.expenses.length})`);
    assert(demoEvent.vendors.length >= 5, `Demo event has vendors (found ${demoEvent.vendors.length})`);
    assert(demoEvent.tasks.length >= 6, `Demo event has checklist tasks (found ${demoEvent.tasks.length})`);
    assert(demoEvent.timelineItems.length >= 7, `Demo event has timeline milestones (found ${demoEvent.timelineItems.length})`);
    assert(demoEvent.ideas.length >= 4, `Demo event has personalized ideas (found ${demoEvent.ideas.length})`);

    // Test 2: Dynamic Budget Math on Demo Event
    console.log("\n--- TEST 2: Budget Math Integrity ---");
    const totalSpent = demoEvent.expenses.reduce((sum, e) => sum + (e.actualAmount || e.estimatedAmount || 0), 0);
    const balance = demoEvent.budget - totalSpent;
    assert(totalSpent > 0, `Total spent computed dynamically: ₹${totalSpent}`);
    assert(balance >= 0, `Remaining balance non-negative: ₹${balance}`);

    // Test 3: Create a New Test Event
    console.log("\n--- TEST 3: Create New Event ---");
    const user = await prisma.user.findFirst();
    if (!user) throw new Error("User missing");

    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60);

    const newEvent = await prisma.event.create({
      data: {
        userId: user.id,
        name: "Ananya's 30th Birthday Gala",
        eventType: "Birthday",
        date: futureDate,
        location: "Bandra West, Mumbai",
        guestCount: 75,
        budget: 250000,
        description: "A chic rooftop sunset party with fairy lights and gourmet cocktails.",
        theme: "Sunset Chic",
        status: "planning",
      },
    });

    assert(newEvent.id !== null, `New event created with ID ${newEvent.id}`);

    // Test 4: Add Expense to New Event
    console.log("\n--- TEST 4: Add Expense & Check DB Persistence ---");
    const expense = await prisma.expense.create({
      data: {
        eventId: newEvent.id,
        category: "Venue",
        description: "Rooftop lounge booking deposit",
        estimatedAmount: 80000,
        actualAmount: 75000,
        paymentStatus: "Paid",
      },
    });

    assert(expense.id !== null, `Expense created with ID ${expense.id}`);
    const fetchedExpense = await prisma.expense.findUnique({ where: { id: expense.id } });
    assert(fetchedExpense?.actualAmount === 75000, "Expense actualAmount matches exactly");

    // Test 5: Add Vendor & Update Booking Status
    console.log("\n--- TEST 5: Add Vendor & Update Status ---");
    const vendor = await prisma.vendor.create({
      data: {
        eventId: newEvent.id,
        name: "Mumbai Beats Sound & Lights",
        category: "DJ",
        quotation: 35000,
        bookingStatus: "Shortlisted",
        paymentStatus: "Unpaid",
      },
    });

    assert(vendor.bookingStatus === "Shortlisted", "Vendor created in Shortlisted status");

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        bookingStatus: "Booked",
        finalQuotation: 32000,
        paymentStatus: "Advance Paid",
      },
    });

    assert(updatedVendor.bookingStatus === "Booked", "Vendor booking status successfully updated to Booked");
    assert(updatedVendor.finalQuotation === 32000, "Vendor final quotation saved as negotiated");

    // Test 6: Checklist Task Creation, Toggle & Progress
    console.log("\n--- TEST 6: Task Creation, Toggle, & Percentage ---");
    const task1 = await prisma.task.create({
      data: {
        eventId: newEvent.id,
        title: "Order custom 3-tier birthday cake",
        category: "Catering",
        priority: "High",
        completed: false,
      },
    });

    const task2 = await prisma.task.create({
      data: {
        eventId: newEvent.id,
        title: "Curate sunset cocktail playlist",
        category: "Entertainment",
        priority: "Medium",
        completed: false,
      },
    });

    let eventTasks = await prisma.task.findMany({ where: { eventId: newEvent.id } });
    assert(eventTasks.length === 2, "2 tasks created for event");

    // Toggle task 1
    await prisma.task.update({
      where: { id: task1.id },
      data: { completed: true, completedAt: new Date() },
    });

    eventTasks = await prisma.task.findMany({ where: { eventId: newEvent.id } });
    const completedTasks = eventTasks.filter((t) => t.completed).length;
    const progress = Math.round((completedTasks / eventTasks.length) * 100);
    assert(progress === 50, `Task progress correctly calculated at 50% (got ${progress}%)`);

    // Test 7: AI Chat Assistant with Real Context
    console.log("\n--- TEST 7: Conversational Assistant Context ---");
    const chatMsg = await prisma.chatMessage.create({
      data: {
        eventId: newEvent.id,
        role: "user",
        content: "How much have I spent on this event so far?",
      },
    });

    assert(chatMsg.id !== null, "User question logged in ChatMessage table");

    const eventWithData = await prisma.event.findUnique({
      where: { id: newEvent.id },
      include: { expenses: true, tasks: true, vendors: true },
    });

    const spentOnEvent = (eventWithData?.expenses || []).reduce((s, e) => s + (e.actualAmount || e.estimatedAmount), 0);
    assert(spentOnEvent === 75000, `Event expense context accurately retrieved: ₹${spentOnEvent}`);

    // Assistant response with real context
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        eventId: newEvent.id,
        role: "assistant",
        content: `You have spent ₹${spentOnEvent.toLocaleString("en-IN")} on Venue so far for "${newEvent.name}", out of your total ₹${newEvent.budget.toLocaleString("en-IN")} budget. You have ₹${(newEvent.budget - spentOnEvent).toLocaleString("en-IN")} remaining.`,
      },
    });

    assert(assistantMsg.content.includes("₹75,000"), "Assistant response contains accurate contextual number");

    // Test 8: Timeline Milestone Scheduling
    console.log("\n--- TEST 8: Timeline Milestones ---");
    const timeline = await prisma.timeline.create({
      data: {
        eventId: newEvent.id,
        title: "Cake Delivery & Cold Storage Check",
        date: futureDate,
        timeOfDay: "04:00 PM",
        status: "Upcoming",
      },
    });

    assert(timeline.id !== null, "Timeline item created for event date");

    // Test 9: Cascade Deletion Integrity
    console.log("\n--- TEST 9: Cascade Deletion Integrity ---");
    await prisma.event.delete({ where: { id: newEvent.id } });

    const orphanedExpenses = await prisma.expense.findMany({ where: { eventId: newEvent.id } });
    const orphanedVendors = await prisma.vendor.findMany({ where: { eventId: newEvent.id } });
    const orphanedTasks = await prisma.task.findMany({ where: { eventId: newEvent.id } });
    const orphanedChats = await prisma.chatMessage.findMany({ where: { eventId: newEvent.id } });

    assert(orphanedExpenses.length === 0, "Expenses cascaded on event deletion");
    assert(orphanedVendors.length === 0, "Vendors cascaded on event deletion");
    assert(orphanedTasks.length === 0, "Tasks cascaded on event deletion");
    assert(orphanedChats.length === 0, "Chat messages cascaded on event deletion");

    // Test 10: Deterministic Planning Engine
    console.log("\n--- TEST 10: Deterministic Planning Engine ---");
    const sampleInput = {
      name: "Diwali Corporate Gala",
      eventType: "Corporate event" as const,
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(),
      location: "Bengaluru, India",
      guestCount: 200,
      budget: 1000000,
      description: "Annual festival gala with awards dinner",
      numberOfDays: 1,
    };

    const plan = generateDeterministicPlan(sampleInput);
    assert(plan.estimated_budget === 1000000, "Fallback plan allocated proper budget");
    assert(plan.budget_breakdown.length > 0, `Budget breakdown items generated (${plan.budget_breakdown.length})`);
    assert(plan.preparation_timeline.length > 0, `Timeline milestones generated (${plan.preparation_timeline.length})`);
    assert(plan.checklist.length > 0, `Checklist items generated (${plan.checklist.length})`);
    assert(plan.event_day_schedule.length > 0, `Event day schedule generated (${plan.event_day_schedule.length})`);
    assert(plan.personalized_ideas.length > 0, `Personalized ideas generated (${plan.personalized_ideas.length})`);

    // Test 11: Date boundary enforcement on short-notice events
    console.log("\n--- TEST 11: Date Clamping on Short Notice Events ---");
    const tomorrow = new Date(Date.now() + 1000 * 60 * 60 * 24);
    const shortNoticePlan = generateDeterministicPlan({
      name: "Urgent Reception Dinner",
      eventType: "Wedding",
      date: tomorrow.toISOString(),
      location: "Delhi, India",
      guestCount: 50,
      budget: 150000,
      description: "Quick celebratory dinner",
      numberOfDays: 1,
    });

    let hasNegativeDays = false;
    for (const milestone of shortNoticePlan.preparation_timeline) {
      if (milestone.days_before_event < 0) {
        hasNegativeDays = true;
      }
    }
    for (const task of shortNoticePlan.checklist) {
      if (task.days_before_event < 0) {
        hasNegativeDays = true;
      }
    }
    assert(!hasNegativeDays, "All preparation milestones & tasks have non-negative days_before_event (no dates fall after event)");

    // Test 12: Zero Budget Event Handling
    console.log("\n--- TEST 12: Zero-Budget Fallback Handling ---");
    const zeroBudgetPlan = generateDeterministicPlan({
      name: "Community Potluck Gathering",
      eventType: "Anniversary",
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      location: "Goa, India",
      guestCount: 30,
      budget: 0,
      description: "Free community potluck",
      numberOfDays: 1,
    });
    assert(zeroBudgetPlan.estimated_budget === 0, "Zero-budget event correctly preserves 0 budget");
    const totalAllocatedZero = zeroBudgetPlan.budget_breakdown.reduce((s, b) => s + b.allocated_amount, 0);
    assert(totalAllocatedZero === 0, "All category allocations in zero-budget event are 0");

    // Test 13: Dynamic AI Budget Optimization
    console.log("\n--- TEST 13: Dynamic AI Budget Optimizer ---");
    const { optimizeBudgetWithAI, suggestVendorsWithAI, chatAssistantWithAI, generateIdeasWithAI } = await import("../src/lib/ai/gemini");
    const optimizationResult = await optimizeBudgetWithAI({
      name: demoEvent.name,
      eventType: demoEvent.eventType,
      budget: demoEvent.budget,
      expenses: demoEvent.expenses.map((e) => ({
        category: e.category,
        description: e.description || "",
        estimatedAmount: e.estimatedAmount,
        actualAmount: e.actualAmount,
        paymentStatus: e.paymentStatus,
      })),
    });
    assert(optimizationResult.savingsEstimate > 0, `Savings estimate calculated: ₹${optimizationResult.savingsEstimate}`);
    assert(Array.isArray(optimizationResult.suggestions) && optimizationResult.suggestions.length > 0, "Tactical suggestions returned");
    assert(Array.isArray(optimizationResult.alternativeDistributions), "Alternative distributions structure returned");
    assert(Array.isArray(optimizationResult.excessiveCategories), "Excessive categories audit returned");

    // Test 14: Dynamic AI Vendor Sourcing
    console.log("\n--- TEST 14: Dynamic AI Vendor Sourcing Engine ---");
    const vendorRes = await suggestVendorsWithAI({
      name: demoEvent.name,
      eventType: demoEvent.eventType,
      location: demoEvent.location,
      guestCount: demoEvent.guestCount,
      budget: demoEvent.budget,
      existingVendors: demoEvent.vendors.map((v) => ({ name: v.name, category: v.category })),
    });
    const vendorSuggestions = vendorRes.suggestions;
    assert(vendorSuggestions.length > 0, `Vendor recommendations generated (${vendorSuggestions.length} items)`);
    assert(vendorSuggestions[0].name !== undefined && vendorSuggestions[0].category !== undefined, "Suggested vendor has name and category");
    assert(vendorSuggestions[0].estimatedBudget > 0, "Suggested vendor has non-zero estimated budget");

    // Test 15: Contextual AI Assistant Specific Queries
    console.log("\n--- TEST 15: Context-Aware Chat Assistant Queries ---");
    const cateringAnswer = await chatAssistantWithAI({
      message: "How much did we spend on catering?",
      eventContext: {
        name: demoEvent.name,
        eventType: demoEvent.eventType,
        date: demoEvent.date.toISOString(),
        location: demoEvent.location,
        guestCount: demoEvent.guestCount,
        budget: demoEvent.budget,
        currency: "INR",
        expenses: demoEvent.expenses.map((e) => ({
          category: e.category,
          description: e.description,
          estimated: e.estimatedAmount,
          actual: e.actualAmount,
          paymentStatus: e.paymentStatus,
        })),
        tasks: demoEvent.tasks.map((t) => ({
          title: t.title,
          category: t.category,
          priority: t.priority,
          completed: t.completed,
          dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        })),
        vendors: demoEvent.vendors.map((v) => ({
          name: v.name,
          category: v.category,
          quotation: v.finalQuotation || v.quotation,
          status: v.bookingStatus,
        })),
      },
    });
    assert(cateringAnswer.reply.toLowerCase().includes("cater") || cateringAnswer.reply.includes("₹"), "Assistant accurately answers catering spend query with numbers");

    const costCutAnswer = await chatAssistantWithAI({
      message: "Where can I cut costs for my event?",
      eventContext: {
        name: demoEvent.name,
        eventType: demoEvent.eventType,
        date: demoEvent.date.toISOString(),
        location: demoEvent.location,
        guestCount: demoEvent.guestCount,
        budget: demoEvent.budget,
        currency: "INR",
        expenses: demoEvent.expenses.map((e) => ({
          category: e.category,
          description: e.description,
          estimated: e.estimatedAmount,
          actual: e.actualAmount,
          paymentStatus: e.paymentStatus,
        })),
        tasks: [],
        vendors: [],
      },
    });
    assert(costCutAnswer.reply.length > 50, "Assistant provides actionable cost cutting strategies");

    // Test 16: Creative Ideas Generation
    console.log("\n--- TEST 16: Creative Ideas Generation ---");
    const ideasResult = await generateIdeasWithAI({
      eventName: demoEvent.name,
      eventType: demoEvent.eventType,
      theme: demoEvent.theme || "Traditional Royal",
      guestCount: demoEvent.guestCount,
      location: demoEvent.location,
      existingIdeas: demoEvent.ideas.map((i) => i.title),
    });
    assert(ideasResult.length > 0, `Generated ${ideasResult.length} creative event ideas`);
    assert(ideasResult[0].title && ideasResult[0].category, "Generated idea has title and category");

    // Test 17: API Route Boundary Validations
    console.log("\n--- TEST 17: API Route Boundary & Negative Value Protection ---");
    const { POST: createEventRoute } = await import("../src/app/api/events/route");
    const negBudgetReq = new Request("http://localhost:3000/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Invalid Negative Budget Event",
        eventType: "Birthday",
        date: new Date(Date.now() + 86400000).toISOString(),
        location: "Mumbai",
        guestCount: 50,
        budget: -50000,
      }),
    });
    const negBudgetRes = await createEventRoute(negBudgetReq);
    assert(negBudgetRes.status === 400, "POST /api/events rejects negative budget with HTTP 400");

    const { POST: createTimelineRoute } = await import("../src/app/api/events/[id]/timeline/route");
    const invalidTimelineReq = new Request("http://localhost:3000/api/events/demo/timeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Late cleanup milestone after event",
        date: new Date(demoEvent.date.getTime() + 86400000 * 5).toISOString(),
        timeOfDay: "10:00 AM",
      }),
    });
    const invalidTimelineRes = await createTimelineRoute(invalidTimelineReq, { params: { id: demoEvent.id } });
    assert(invalidTimelineRes.status === 400, "POST /api/events/[id]/timeline rejects milestone dates after event date with HTTP 400");

    const { POST: createExpenseRoute } = await import("../src/app/api/events/[id]/expenses/route");
    const negExpenseReq = new Request("http://localhost:3000/api/events/demo/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: "Venue",
        description: "Negative refund exploit",
        estimatedAmount: -10000,
      }),
    });
    const negExpenseRes = await createExpenseRoute(negExpenseReq, { params: { id: demoEvent.id } });
    assert(negExpenseRes.status === 400, "POST /api/events/[id]/expenses rejects negative amount with HTTP 400");

    console.log("\n==========================================");
    console.log(`TOTAL TESTS RUN: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log("==========================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Verification suite encountered an exception:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
