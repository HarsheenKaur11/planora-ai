import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function POST() {
  try {
    const { stdout, stderr } = await execPromise("node prisma/seed.js");
    return NextResponse.json({
      success: true,
      message: "Database seeded successfully with demo wedding data",
      output: stdout,
    });
  } catch (error: any) {
    console.error("POST /api/seed error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
