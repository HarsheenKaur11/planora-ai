import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        expenses: {
          orderBy: { createdAt: "desc" },
        },
        vendors: {
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
        },
        timelineItems: {
          orderBy: { date: "asc" },
        },
        ideas: {
          orderBy: { createdAt: "desc" },
        },
        chatMessages: {
          orderBy: { createdAt: "asc" },
          take: 50,
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error: any) {
    console.error("GET /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    if (body.budget !== undefined && (Number(body.budget) < 0 || isNaN(Number(body.budget)))) {
      return NextResponse.json({ error: "Budget must be a non-negative number" }, { status: 400 });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        eventType: body.eventType !== undefined ? body.eventType : undefined,
        date: body.date ? new Date(body.date) : undefined,
        location: body.location !== undefined ? body.location : undefined,
        guestCount: body.guestCount !== undefined ? Number(body.guestCount) : undefined,
        budget: body.budget !== undefined ? Math.max(0, Number(body.budget)) : undefined,
        description: body.description !== undefined ? body.description : undefined,
        theme: body.theme !== undefined ? body.theme : undefined,
        themeDescription: body.themeDescription !== undefined ? body.themeDescription : undefined,
        indoorOutdoor: body.indoorOutdoor !== undefined ? body.indoorOutdoor : undefined,
        culturalPref: body.culturalPref !== undefined ? body.culturalPref : undefined,
        dietaryPref: body.dietaryPref !== undefined ? body.dietaryPref : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/events/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verify existence
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // SQLite cascade delete handled by Prisma
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Event deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}
