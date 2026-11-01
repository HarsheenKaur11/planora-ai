import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expenses = await prisma.expense.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.category || !body.description) {
      return NextResponse.json({ error: "Category and description are required" }, { status: 400 });
    }

    const estAmount = Number(body.estimatedAmount) || 0;
    const actAmount = Number(body.actualAmount) || 0;

    if (estAmount < 0 || isNaN(estAmount) || actAmount < 0 || isNaN(actAmount)) {
      return NextResponse.json({ error: "Expense amounts must be non-negative numbers" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        eventId: params.id,
        category: body.category,
        description: body.description,
        estimatedAmount: estAmount,
        actualAmount: actAmount,
        paymentStatus: body.paymentStatus || "Pending",
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create expense" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    if (
      body.estimatedAmount !== undefined &&
      (Number(body.estimatedAmount) < 0 || isNaN(Number(body.estimatedAmount)))
    ) {
      return NextResponse.json({ error: "Estimated amount must be non-negative" }, { status: 400 });
    }

    if (
      body.actualAmount !== undefined &&
      (Number(body.actualAmount) < 0 || isNaN(Number(body.actualAmount)))
    ) {
      return NextResponse.json({ error: "Actual amount must be non-negative" }, { status: 400 });
    }

    const updated = await prisma.expense.update({
      where: { id: body.id },
      data: {
        category: body.category !== undefined ? body.category : undefined,
        description: body.description !== undefined ? body.description : undefined,
        estimatedAmount: body.estimatedAmount !== undefined ? Number(body.estimatedAmount) : undefined,
        actualAmount: body.actualAmount !== undefined ? Number(body.actualAmount) : undefined,
        paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Expense ID query parameter is required" }, { status: 400 });
    }

    await prisma.expense.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete expense" }, { status: 500 });
  }
}
