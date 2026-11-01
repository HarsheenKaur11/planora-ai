import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { optimizeBudgetWithAI } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { expenses: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const optimization = await optimizeBudgetWithAI({
      name: event.name,
      eventType: event.eventType,
      budget: event.budget,
      expenses: event.expenses.map((e) => ({
        category: e.category,
        description: e.description,
        estimatedAmount: e.estimatedAmount,
        actualAmount: e.actualAmount,
        paymentStatus: e.paymentStatus,
      })),
    });

    return NextResponse.json(optimization);
  } catch (error: any) {
    console.error("POST /api/ai/optimize-budget error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to optimize budget" },
      { status: 500 }
    );
  }
}
