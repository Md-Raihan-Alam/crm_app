import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { Customer } from "@/models/types";

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

    // Customer role: resolve their own record by email — same pattern as
    // the tasks route — since the userId link isn't reliably set.
    const customers = db.collection<Customer>("customers");
    const ownRecord = await customers.findOne({ email: user.email });

    if (!ownRecord) {
      return NextResponse.json(
        { stats: { myOpenTasks: 0, myNotes: 0 } },
        { status: 200 }
      );
    }

    const [myOpenTasks, myNotes] = await Promise.all([
      db.collection("tasks").countDocuments({
        customerId: ownRecord._id,
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
