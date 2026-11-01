import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: "Guest Planner",
          email: "guest@planora.ai",
          currency: "INR",
          language: "English",
          location: "New Delhi, India",
        },
      });
    }
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: body.name || "Guest Planner",
          email: body.email || null,
          currency: body.currency || "INR",
          language: body.language || "English",
          location: body.location || "New Delhi, India",
          preferences: body.preferences ? JSON.stringify(body.preferences) : null,
        },
      });
      return NextResponse.json(user);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        email: body.email !== undefined ? body.email : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        language: body.language !== undefined ? body.language : undefined,
        location: body.location !== undefined ? body.location : undefined,
        preferences: body.preferences !== undefined ? (typeof body.preferences === "string" ? body.preferences : JSON.stringify(body.preferences)) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update user profile" }, { status: 500 });
  }
}
