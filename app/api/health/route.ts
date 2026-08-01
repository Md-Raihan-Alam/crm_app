import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();

    // "ping" is a lightweight command that just confirms the connection
    // is alive — it doesn't touch any real data.
    await db.command({ ping: 1 });

    return NextResponse.json(
      { status: "ok", message: "Database connection successful" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
}
