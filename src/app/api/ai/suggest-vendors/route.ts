import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { suggestVendorsWithAI } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { vendors: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const result = await suggestVendorsWithAI({
      name: event.name,
      eventType: event.eventType,
      location: event.location,
      budget: event.budget,
      guestCount: event.guestCount,
      existingVendors: event.vendors.map((v) => ({ category: v.category, name: v.name })),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/ai/suggest-vendors error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate vendor suggestions" },
      { status: 500 }
    );
  }
}
