import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: { eventId: params.id },
      orderBy: [{ completed: "asc" }, { priority: "desc" }, { dueDate: "asc" }],
    });
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        eventId: params.id,
        title: body.title,
        description: body.description || null,
        category: body.category || "General",
        priority: body.priority || "Medium",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completed: Boolean(body.completed),
        completedAt: body.completed ? new Date() : null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create task" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const completed = Boolean(body.completed);
    const updated = await prisma.task.update({
      where: { id: body.id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to toggle task" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id: body.id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        description: body.description !== undefined ? body.description : undefined,
        category: body.category !== undefined ? body.category : undefined,
        priority: body.priority !== undefined ? body.priority : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        completed: body.completed !== undefined ? Boolean(body.completed) : undefined,
        completedAt: body.completed ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Task ID query parameter is required" }, { status: 400 });
    }

    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete task" }, { status: 500 });
  }
}
