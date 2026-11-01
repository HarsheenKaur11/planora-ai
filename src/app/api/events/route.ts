import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/events - List all events with aggregated metrics
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            expenses: true,
            vendors: true,
            tasks: true,
            timelineItems: true,
            ideas: true,
          },
        },
        expenses: {
          select: {
            actualAmount: true,
            estimatedAmount: true,
          },
        },
        tasks: {
          select: {
            completed: true,
          },
        },
      },
    });

    const enriched = events.map((event) => {
      const totalSpent = event.expenses.reduce(
        (sum, e) => sum + (e.actualAmount || e.estimatedAmount || 0),
        0
      );
      const completedTasks = event.tasks.filter((t) => t.completed).length;
      const totalTasks = event.tasks.length;
      const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        ...event,
        totalSpent,
        completedTasks,
        totalTasks,
        taskProgress,
        expenses: undefined,
        tasks: undefined,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

// POST /api/events - Create a new event manually or from AI plan
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.eventType || !body.date) {
      return NextResponse.json(
        { error: "Name, eventType, and date are required fields" },
        { status: 400 }
      );
    }

    if (body.budget !== undefined && (Number(body.budget) < 0 || isNaN(Number(body.budget)))) {
      return NextResponse.json(
        { error: "Budget must be a non-negative number" },
        { status: 400 }
      );
    }

    // Find or create default user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Guest Organizer",
          email: "organizer@planora.ai",
          currency: "INR",
          location: body.location || "New Delhi, India",
        },
      });
    }

    const eventDate = new Date(body.date);
    const now = new Date();
    const isFutureEvent = eventDate.getTime() > now.getTime();

    const event = await prisma.event.create({
      data: {
        userId: user.id,
        name: body.name,
        eventType: body.eventType,
        date: eventDate,
        location: body.location || "India",
        guestCount: Number(body.guestCount) || 50,
        budget: Math.max(0, Number(body.budget) || 0),
        description: body.description || "",
        theme: body.theme || "Elegance & Celebration",
        themeDescription: body.themeDescription || "",
        indoorOutdoor: body.indoorOutdoor || "Flexible",
        culturalPref: body.culturalPref || body.culturalPreferences || "",
        dietaryPref: body.dietaryPref || body.dietaryPreferences || "",
        isDemo: Boolean(body.isDemo),
        status: body.status || "planning",
      },
    });

    // If an initial plan payload was passed (from AI generator), populate related tables in a transaction!
    if (body.initialPlan) {
      const plan = body.initialPlan;

      // Expenses
      if (plan.budget_breakdown && Array.isArray(plan.budget_breakdown)) {
        for (const b of plan.budget_breakdown) {
          await prisma.expense.create({
            data: {
              eventId: event.id,
              category: b.category,
              description: b.description || `Allocated for ${b.category}`,
              estimatedAmount: Math.max(0, Number(b.allocated_amount) || 0),
              actualAmount: 0,
              paymentStatus: "Pending",
            },
          });
        }
      }

      // Vendors
      if (plan.vendor_categories && Array.isArray(plan.vendor_categories)) {
        for (const v of plan.vendor_categories) {
          await prisma.vendor.create({
            data: {
              eventId: event.id,
              name: v.name,
              category: v.category,
              quotation: Math.max(0, Number(v.estimated_budget) || 0),
              bookingStatus: "Not contacted",
              paymentStatus: "Unpaid",
              notes: v.notes || "",
            },
          });
        }
      }

      // Tasks: clamp dates so preparation dates never fall after the event
      if (plan.checklist && Array.isArray(plan.checklist)) {
        for (const t of plan.checklist) {
          const daysBefore = Math.max(0, Number(t.days_before_event) || 14);
          const rawDueDate = new Date(eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
          let finalDueDate = rawDueDate.getTime() > eventDate.getTime() ? eventDate : rawDueDate;
          if (isFutureEvent && finalDueDate.getTime() < now.getTime()) {
            finalDueDate = now;
          }
          if (finalDueDate.getTime() > eventDate.getTime()) {
            finalDueDate = eventDate;
          }

          await prisma.task.create({
            data: {
              eventId: event.id,
              title: t.title,
              description: t.description || "",
              category: t.category || "General",
              priority: t.priority || "Medium",
              dueDate: finalDueDate,
              completed: false,
            },
          });
        }
      }

      // Timeline: clamp dates so preparation dates never fall after the event
      if (plan.preparation_timeline && Array.isArray(plan.preparation_timeline)) {
        for (const pt of plan.preparation_timeline) {
          const daysBefore = Math.max(0, Number(pt.days_before_event) || 10);
          const rawTarget = new Date(eventDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);
          let finalTarget = rawTarget.getTime() > eventDate.getTime() ? eventDate : rawTarget;
          if (isFutureEvent && finalTarget.getTime() < now.getTime()) {
            finalTarget = now;
          }
          if (finalTarget.getTime() > eventDate.getTime()) {
            finalTarget = eventDate;
          }

          await prisma.timeline.create({
            data: {
              eventId: event.id,
              title: pt.title,
              description: pt.description || "",
              date: finalTarget,
              status: "Upcoming",
              timeOfDay: pt.time_of_day || "Morning",
            },
          });
        }
      }

      // Day-of Schedule Timelines
      if (plan.event_day_schedule && Array.isArray(plan.event_day_schedule)) {
        const eventDate = new Date(body.date);
        for (const eds of plan.event_day_schedule) {
          await prisma.timeline.create({
            data: {
              eventId: event.id,
              title: eds.activity,
              description: eds.description || "",
              date: eventDate,
              status: "Upcoming",
              timeOfDay: eds.time || "Scheduled",
            },
          });
        }
      }

      // Ideas
      if (plan.personalized_ideas && Array.isArray(plan.personalized_ideas)) {
        for (const idea of plan.personalized_ideas) {
          await prisma.idea.create({
            data: {
              eventId: event.id,
              category: idea.category || "General",
              title: idea.title,
              description: idea.description,
              tags: Array.isArray(idea.tags) ? idea.tags.join(", ") : "",
              saved: true,
            },
          });
        }
      }

      // Welcome Chat message from AI
      await prisma.chatMessage.create({
        data: {
          eventId: event.id,
          role: "assistant",
          content: `Welcome to **${event.name}**! I have created your tailored event structure with a planned budget of ₹${(event.budget || 0).toLocaleString("en-IN")}, recommended vendors, and initial preparation milestones. Let me know what you would like to adjust or explore!`,
        },
      });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create event" }, { status: 500 });
  }
}
