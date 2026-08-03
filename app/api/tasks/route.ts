import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { Task, Customer } from "@/models/types";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const db = await getDb();
    const tasks = db.collection<Task>("tasks");

    if (user.role === "admin") {
      // Join in the assignee's user info and the related customer's name —
      // scoped to just the fields the table actually displays.
      const items = await tasks
        .aggregate([
          { $sort: { dueDate: 1, createdAt: -1 } },
          {
            $lookup: {
              from: "users",
              localField: "assignedTo",
              foreignField: "_id",
              as: "assignee",
            },
          },
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
              assigneeName: { $arrayElemAt: ["$assignee.name", 0] },
              assigneeEmail: { $arrayElemAt: ["$assignee.email", 0] },
              customerName: { $arrayElemAt: ["$customer.name", 0] },
            },
          },
          { $project: { assignee: 0, customer: 0 } },
        ])
        .toArray();

      return NextResponse.json({ tasks: items }, { status: 200 });
    }

    // Customer role: unchanged — resolve their own record by email, match
    // tasks whose customerId is their linked customer record.
    const customers = db.collection<Customer>("customers");
    const ownRecord = await customers.findOne({ email: user.email });

    const assigneeIds = [user._id!];
    if (ownRecord?._id) {
      assigneeIds.push(ownRecord._id);
    }

    const filter = { customerId: { $in: assigneeIds } };

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
