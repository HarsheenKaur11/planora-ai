import { NextResponse } from "next/server";
import { EventInputSchema } from "@/lib/ai/types";
import { generateEventPlan } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const rawBody = await req.json();

    const parseResult = EventInputSchema.safeParse({
      ...rawBody,
      guestCount: Number(rawBody.guestCount),
      budget: Number(rawBody.budget),
      numberOfDays: rawBody.numberOfDays ? Number(rawBody.numberOfDays) : 1,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input parameters",
          details: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const aiPlanResult = await generateEventPlan(parseResult.data);
    return NextResponse.json(aiPlanResult);
  } catch (error: any) {
    console.error("POST /api/ai/generate-plan error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI plan" },
      { status: 500 }
    );
  }
}
