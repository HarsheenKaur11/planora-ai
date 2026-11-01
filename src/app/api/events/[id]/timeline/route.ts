import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const timelines = await prisma.timeline.findMany({
      where: { eventId: params.id },
      orderBy: { date: "asc" },
    });
    return NextResponse.json(timelines);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.title || !body.date) {
      return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const milestoneDate = new Date(body.date);
    const eventDate = new Date(event.date);

    if (milestoneDate.getTime() > eventDate.getTime()) {
      return NextResponse.json(
        { error: "Milestone date cannot fall after the event date" },
        { status: 400 }
      );
    }

    const item = await prisma.timeline.create({
      data: {
        eventId: params.id,
        title: body.title,
        description: body.description || null,
        date: milestoneDate,
        status: body.status || "Upcoming",
        timeOfDay: body.timeOfDay || null,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create timeline item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Timeline ID is required" }, { status: 400 });
    }

    if (body.date) {
      const existing = await prisma.timeline.findUnique({
        where: { id: body.id },
        include: { event: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Timeline item not found" }, { status: 404 });
      }

      if (existing.event) {
        const milestoneDate = new Date(body.date);
        const eventDate = new Date(existing.event.date);
        if (milestoneDate.getTime() > eventDate.getTime()) {
          return NextResponse.json(
            { error: "Milestone date cannot fall after the event date" },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.timeline.update({
      where: { id: body.id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        date: body.date ? new Date(body.date) : undefined,
        status: body.status !== undefined ? body.status : undefined,
        timeOfDay: body.timeOfDay !== undefined ? body.timeOfDay : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update timeline item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Timeline ID query parameter is required" }, { status: 400 });
    }

    await prisma.timeline.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete timeline item" }, { status: 500 });
  }
}
