import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authGuard";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"]);
    const db = await getDb();

    const [customersByStatus, tasksByStatus] = await Promise.all([
      db
        .collection("customers")
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
      db
        .collection("tasks")
        .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
    ]);

    return NextResponse.json(
      { customersByStatus, tasksByStatus },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
