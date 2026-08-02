import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { getOwnCustomerRecord } from "@/lib/customerAccess";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const db = await getDb();
    const notes = db.collection("notes");

    if (user.role === "admin") {
      // $lookup joins in the customer's name for display, without fetching
      // full customer documents — scoped to exactly what the list needs.
      const items = await notes
        .aggregate([
          { $sort: { createdAt: -1 } },
          { $limit: 100 },
          {
            $lookup: {
              from: "customers",
              localField: "customerId",
              foreignField: "_id",
              as: "customer",
            },
          },
          {
            $addFields: {
              customerName: { $arrayElemAt: ["$customer.name", 0] },
            },
          },
          { $project: { customer: 0 } },
        ])
        .toArray();

      return NextResponse.json({ notes: items }, { status: 200 });
    }

    // Customer role: only their own visible notes.
    const ownRecord = await getOwnCustomerRecord(user._id!);
    if (!ownRecord) {
      return NextResponse.json({ notes: [] }, { status: 200 });
    }

    const items = await notes
      .find({ customerId: ownRecord._id, visibleToCustomer: true })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ notes: items }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("List all notes error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
