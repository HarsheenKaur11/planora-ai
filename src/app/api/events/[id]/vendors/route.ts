import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vendors = await prisma.vendor.findMany({
      where: { eventId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(vendors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    if (!body.name || !body.category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    const quote = Number(body.quotation) || 0;
    const finalQuote = body.finalQuotation !== undefined && body.finalQuotation !== null && body.finalQuotation !== "" ? Number(body.finalQuotation) : null;

    if (quote < 0 || isNaN(quote) || (finalQuote !== null && (finalQuote < 0 || isNaN(finalQuote)))) {
      return NextResponse.json({ error: "Vendor quotation amounts must be non-negative" }, { status: 400 });
    }

    const vendor = await prisma.vendor.create({
      data: {
        eventId: params.id,
        name: body.name,
        category: body.category,
        contactPerson: body.contactPerson || null,
        phone: body.phone || null,
        email: body.email || null,
        quotation: quote,
        finalQuotation: finalQuote,
        bookingStatus: body.bookingStatus || "Not contacted",
        paymentStatus: body.paymentStatus || "Unpaid",
        notes: body.notes || null,
        rating: body.rating ? Number(body.rating) : 4.8,
        website: body.website || null,
      },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create vendor" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Vendor ID is required" }, { status: 400 });
    }

    if (body.quotation !== undefined && (Number(body.quotation) < 0 || isNaN(Number(body.quotation)))) {
      return NextResponse.json({ error: "Quotation must be a non-negative number" }, { status: 400 });
    }

    if (
      body.finalQuotation !== undefined &&
      body.finalQuotation !== null &&
      body.finalQuotation !== "" &&
      (Number(body.finalQuotation) < 0 || isNaN(Number(body.finalQuotation)))
    ) {
      return NextResponse.json({ error: "Final quotation must be a non-negative number" }, { status: 400 });
    }

    const updated = await prisma.vendor.update({
      where: { id: body.id },
      data: {
        name: body.name !== undefined ? body.name : undefined,
        category: body.category !== undefined ? body.category : undefined,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : undefined,
        phone: body.phone !== undefined ? body.phone : undefined,
        email: body.email !== undefined ? body.email : undefined,
        quotation: body.quotation !== undefined ? Math.max(0, Number(body.quotation)) : undefined,
        finalQuotation:
          body.finalQuotation !== undefined
            ? body.finalQuotation !== null && body.finalQuotation !== ""
              ? Math.max(0, Number(body.finalQuotation))
              : null
            : undefined,
        bookingStatus: body.bookingStatus !== undefined ? body.bookingStatus : undefined,
        paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        rating: body.rating !== undefined ? (body.rating ? Number(body.rating) : null) : undefined,
        website: body.website !== undefined ? body.website : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update vendor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Vendor ID query parameter is required" }, { status: 400 });
    }

    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to delete vendor" }, { status: 500 });
  }
}
