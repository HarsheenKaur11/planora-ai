import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { hasValidGeminiKey } from "@/lib/ai/gemini";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
  try {
    const { eventId, category } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ideas: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const existingTitles = event.ideas.map((i) => i.title.toLowerCase());

    // Curated rich ideas catalog tailored for Indian & contemporary events
    const pool = [
      {
        category: "Decoration",
        title: "Champagne Mirrored Aisle with Hanging Mogra Chandeliers",
        description: "Create an ethereal walkway with reflective mirrored runners, brass floor lanterns, and cascading natural jasmine chandeliers.",
        tags: "Floral, Lighting, Royal",
      },
      {
        category: "Catering",
        title: "Artisanal Chai Bar & Live Jalebi-Rabdi Station",
        description: "An evening interactive tea-lounge serving Kashmiri Kahwa, Kulhad Masala Chai, and piping hot kesar jalebi with malai rabdi.",
        tags: "Food, Tea Lounge, Traditional",
      },
      {
        category: "Entertainment",
        title: "Live Flute & Santoor Twilight Welcome",
        description: "Welcome arriving guests with soothing classical Indian acoustic ragas before transitioning into celebratory dhol beats.",
        tags: "Music, Live Ragas, Ambience",
      },
      {
        category: "Guest Experience",
        title: "Bespoke Ittar (Perfume) Bar & Silk Stoles",
        description: "A luxury fragrance counter where guests blend their own customized organic floral attar vials as a personalized keepsake.",
        tags: "Favors, Interactive, Luxury",
      },
      {
        category: "Photography Concepts",
        title: "Sunset Golden Hour Silhouette Couple Shoot",
        description: "Coordinate a 20-minute private twilight portrait session against backlit brass lattice or illuminated open lawn fountains.",
        tags: "Photos, Drone, Golden Hour",
      },
      {
        category: "Budget-Friendly Alternatives",
        title: "Fairy-Lit Botanical Foliage Runners",
        description: "Substitute expensive out-of-season blooms with lush eucalyptus, local ferns, and micro fairy light strings for an opulent organic aesthetic at 40% cost.",
        tags: "Eco-Friendly, Cost Saving, Modern",
      },
      {
        category: "Return Gifts",
        title: "Curated Artisanal Brass Spice & Mithai Hampers",
        description: "Handcrafted brass containers filled with organic Kashmiri saffron, roasted nuts, and heritage Besan Laddoos wrapped in handloom fabric.",
        tags: "Favors, Heritage, Keepsake",
      },
    ];

    let candidates = pool.filter(
      (p) =>
        (!category || category === "All" || p.category.toLowerCase() === category.toLowerCase()) &&
        !existingTitles.some((t) => t.includes(p.title.toLowerCase().slice(0, 15)))
    );

    if (candidates.length === 0) {
      candidates = pool.slice(0, 2);
    }

    let ideasToSave = candidates.slice(0, 3);

    // If Gemini key is available, generate fresh ideas
    if (hasValidGeminiKey()) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `
Generate 3 unique, culturally sensitive, personalized event ideas for:
Event: ${event.name} (${event.eventType}) in ${event.location}
Guest Count: ${event.guestCount}, Budget: ₹${event.budget}
Theme: ${event.theme || "Celebration"}
${category && category !== "All" ? `Focus specifically on category: ${category}` : ""}

Return JSON array:
[
  {
    "category": "Decoration" | "Catering" | "Entertainment" | "Guest Experience" | "Photography Concepts" | "Budget-Friendly Alternatives" | "Return Gifts",
    "title": "Creative Title",
    "description": "2-sentence inspiring description with actionable execution tips",
    "tags": "Tag1, Tag2"
  }
]
`;
        const res = await model.generateContent(prompt);
        const text = res.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          ideasToSave = parsed.map((item: any) => ({
            category: item.category || "General",
            title: item.title,
            description: item.description,
            tags: typeof item.tags === "string" ? item.tags : Array.isArray(item.tags) ? item.tags.join(", ") : "AI Idea",
          }));
        }
      } catch (err) {
        console.warn("Gemini idea generation failed, using curated ideas", err);
      }
    }

    const created = [];
    for (const idea of ideasToSave) {
      const record = await prisma.idea.create({
        data: {
          eventId: event.id,
          category: idea.category,
          title: idea.title,
          description: idea.description,
          tags: idea.tags,
          saved: true,
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      success: true,
      createdCount: created.length,
      ideas: created,
    });
  } catch (error: any) {
    console.error("POST /api/ai/generate-ideas error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate ideas" },
      { status: 500 }
    );
  }
}
