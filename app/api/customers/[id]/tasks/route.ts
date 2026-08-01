import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, requireRole, AuthError } from "@/lib/authGuard";
import { isOwnCustomerRecord } from "@/lib/customerAccess";
import { logAction } from "@/lib/auditLog";
import { Task } from "@/models/types";

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireRole(["admin"]);

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid customer id." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { title, description, assignedTo, dueDate } = body;

    if (!title || typeof title !== "string" || title.trim().length < 2) {
      return NextResponse.json(
        { error: "Task title must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (
      !assignedTo ||
      typeof assignedTo !== "string" ||
      !isValidObjectId(assignedTo)
    ) {
      return NextResponse.json(
        { error: "A valid assignee is required." },
        { status: 400 }
      );
    }

    const db = await getDb();

    const customerExists = await db
      .collection("customers")
      .findOne({ _id: new ObjectId(id) });
    if (!customerExists) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const assigneeExists = await db
      .collection("users")
      .findOne({ _id: new ObjectId(assignedTo) });
    if (!assigneeExists) {
      return NextResponse.json(
        { error: "Assignee not found." },
        { status: 404 }
      );
    }

    let parsedDueDate: Date | undefined;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "Invalid due date." },
          { status: 400 }
        );
      }
      parsedDueDate = d;
    }

    const tasks = db.collection<Task>("tasks");
    const now = new Date();
    const newTask: Task = {
      customerId: new ObjectId(id),
      assignedTo: new ObjectId(assignedTo),
      title: title.trim(),
      description:
        typeof description === "string" ? description.trim() : undefined,
      status: "pending",
      dueDate: parsedDueDate,
      createdBy: admin._id!,
      createdAt: now,
      updatedAt: now,
    };

    const result = await tasks.insertOne(newTask);

    await logAction({
      userId: admin._id!,
      action: "task.created",
      customerId: new ObjectId(id),
      targetId: result.insertedId,
      details: `Created task "${newTask.title}" assigned to ${
        assigneeExists.name || assignedTo
      }`,
    });

    return NextResponse.json(
      {
        message: "Task created.",
        task: { ...newTask, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid customer id." },
        { status: 400 }
      );
    }

    const customerId = new ObjectId(id);

    if (user.role === "customer") {
      const owns = await isOwnCustomerRecord(user._id!, customerId);
      if (!owns) {
        return NextResponse.json(
          { error: "You do not have permission to view these tasks." },
          { status: 403 }
        );
      }
    }

    const db = await getDb();
    const tasks = db.collection<Task>("tasks");

    const filter =
      user.role === "admin"
        ? { customerId }
        : { customerId, assignedTo: user._id! };

    const items = await tasks.find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ tasks: items }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("List tasks error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
