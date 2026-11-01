import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { tasks: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingTitles = event.tasks.map((t) => t.title.toLowerCase());
    const candidates = [
      {
        title: "Coordinate guest transportation and parking permits",
        description: "Arrange valet parking signage and shuttle options for elder guests",
        category: "Logistics",
        priority: "Medium",
        daysBefore: 7,
      },
      {
        title: "Pack emergency event day kit",
        description: "Safety pins, stain remover, basic medical kit, double-sided tape, phone power banks",
        category: "Operations",
        priority: "High",
        daysBefore: 3,
      },
      {
        title: "Confirm stage audio-visual and playlist cues",
        description: "Share bride/groom/host entry song cues and microphone tests with the sound engineer",
        category: "Entertainment",
        priority: "High",
        daysBefore: 5,
      },
      {
        title: "Print table place cards and welcome signage",
        description: "Verify correct spelling of guest names and place cards for reserved family tables",
        category: "Stationery",
        priority: "Low",
        daysBefore: 10,
      },
      {
        title: "Prepare vendor final settlement envelopes",
        description: "Keep labeled cash or cheque envelopes ready for night-of vendor balance settlements",
        category: "Finance",
        priority: "High",
        daysBefore: 2,
      },
      {
        title: "Review dietary allergen notices with head banquet chef",
        description: "Confirm dedicated counters for Jain, gluten-free, or specific dietary restrictions",
        category: "Catering",
        priority: "Medium",
        daysBefore: 6,
      },
    ];

    // Filter out candidates that are already present
    const newCandidates = candidates.filter(
      (c) => !existingTitles.some((existing) => existing.includes(c.title.toLowerCase().slice(0, 15)))
    );

    // If Gemini key is available, we can also generate custom tasks
    let generatedTasks = newCandidates.slice(0, 3);

    if (GEMINI_API_KEY && GEMINI_API_KEY.trim() !== "") {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `
Generate 3 distinct, practical checklist tasks for:
Event: ${event.name} (${event.eventType}) in ${event.location} for ${event.guestCount} guests.
Existing tasks to avoid duplicating: ${existingTitles.join(", ")}

Return JSON array:
[
  {
    "title": "task title",
    "description": "actionable detail",
    "category": "Category",
    "priority": "High" | "Medium" | "Low",
    "daysBefore": 5
  }
]
`;
        const res = await model.generateContent(prompt);
        const text = res.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          generatedTasks = parsed;
        }
      } catch (err) {
        console.warn("Gemini task generation error, falling back to curated suggestions", err);
      }
    }

    // Persist new tasks directly
    const createdTasks = [];
    const eventDate = new Date(event.date);
    const now = new Date();

    for (const item of generatedTasks) {
      const days = Number(item.daysBefore) || 7;
      const dueDate = new Date(eventDate.getTime() - days * 24 * 60 * 60 * 1000);

      const t = await prisma.task.create({
        data: {
          eventId: event.id,
          title: item.title,
          description: item.description || "",
          category: item.category || "General",
          priority: item.priority || "Medium",
          dueDate: dueDate < now ? now : dueDate,
          completed: false,
        },
      });
      createdTasks.push(t);
    }

    return NextResponse.json({
      success: true,
      createdCount: createdTasks.length,
      tasks: createdTasks,
    });
  } catch (error: any) {
    console.error("POST /api/ai/generate-tasks error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate tasks" },
      { status: 500 }
    );
  }
}
