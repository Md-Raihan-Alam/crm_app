import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { Task } from "@/models/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const db = await getDb();
    const tasks = db.collection<Task>("tasks");

    // "My Tasks" view: admins see everything assigned to anyone (their full
    // workload view), customers see only what's assigned to them.
    const filter = user.role === "admin" ? {} : { assignedTo: user._id! };

    const items = await tasks
      .find(filter)
      .sort({ dueDate: 1, createdAt: -1 })
      .toArray();

    return NextResponse.json({ tasks: items }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("List all tasks error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
