import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { getOwnCustomerRecord } from "@/lib/customerAccess";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const db = await getDb();

    if (user.role === "admin") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [totalCustomers, openTasks, activeLeads, notesThisWeek] =
        await Promise.all([
          db.collection("customers").countDocuments({}),
          db
            .collection("tasks")
            .countDocuments({ status: { $ne: "completed" } }),
          db.collection("customers").countDocuments({ status: "lead" }),
          db
            .collection("notes")
            .countDocuments({ createdAt: { $gte: oneWeekAgo } }),
        ]);

      return NextResponse.json(
        {
          stats: {
            totalCustomers,
            openTasks,
            activeLeads,
            notesThisWeek,
          },
        },
        { status: 200 }
      );
    }

    // Customer role: scoped entirely to their own data.
    const ownRecord = await getOwnCustomerRecord(user._id!);

    if (!ownRecord) {
      return NextResponse.json(
        { stats: { myOpenTasks: 0, myNotes: 0 } },
        { status: 200 }
      );
    }

    const [myOpenTasks, myNotes] = await Promise.all([
      db.collection("tasks").countDocuments({
        assignedTo: user._id,
        status: { $ne: "completed" },
      }),
      db.collection("notes").countDocuments({
        customerId: ownRecord._id,
        visibleToCustomer: true,
      }),
    ]);

    return NextResponse.json(
      { stats: { myOpenTasks, myNotes } },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Get dashboard stats error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
