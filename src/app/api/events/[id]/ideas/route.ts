import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const ideas = await prisma.idea.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(ideas);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.title || !body.category) {
      return NextResponse.json({ error: "Title and category are required" }, { status: 400 });
    }

    const idea = await prisma.idea.create({
      data: {
        eventId: params.id,
        title: body.title,
        category: body.category,
        description: body.description || "",
        tags: body.tags || null,
        saved: body.saved !== undefined ? Boolean(body.saved) : true,
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create idea" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Idea ID is required" }, { status: 400 });
    }

    const updated = await prisma.idea.update({
      where: { id: body.id },
      data: {
        saved: body.saved !== undefined ? Boolean(body.saved) : true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to toggle idea" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Idea ID query parameter is required" }, { status: 400 });
    }

    await prisma.idea.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete idea" }, { status: 500 });
  }
}
