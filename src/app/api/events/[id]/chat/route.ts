import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { chatAssistantWithAI } from "@/lib/ai/gemini";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Retrieve active event context with related records
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        expenses: true,
        vendors: true,
        tasks: true,
        timelineItems: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Save user message
    const userMsg = await prisma.chatMessage.create({
      data: {
        eventId: id,
        role: "user",
        content: message.trim(),
      },
    });

    // Fetch last 10 messages for conversation context
    const history = await prisma.chatMessage.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    // Run AI response
    const aiResponse = await chatAssistantWithAI({
      eventContext: event,
      history: history.map((h) => ({ role: h.role, content: h.content })),
      userMessage: message.trim(),
    });

    // Save assistant message
    const assistantMsg = await prisma.chatMessage.create({
      data: {
        eventId: id,
        role: "assistant",
        content: aiResponse.reply,
      },
    });

    return NextResponse.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      source: aiResponse.source,
      suggestions: aiResponse.suggestions || [],
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/chat error:", error);
    return NextResponse.json({ error: error?.message || "Failed to process chat" }, { status: 500 });
  }
}
