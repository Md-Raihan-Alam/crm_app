import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/authGuard";
import { logAction } from "@/lib/auditLog";
import { Task } from "@/models/types";

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

type RouteParams = { params: Promise<{ taskId: string }> };

const ALLOWED_STATUSES = ["pending", "in-progress", "completed"];

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();

    const { taskId } = await params;
    if (!isValidObjectId(taskId)) {
      return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    }

    const db = await getDb();
    const tasks = db.collection<Task>("tasks");

    const existingTask = await tasks.findOne({ _id: new ObjectId(taskId) });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const body = await req.json();
    const updates: Partial<Task> = {};

    if (user.role === "customer") {
      if (String(existingTask.assignedTo) !== String(user._id)) {
        return NextResponse.json(
          { error: "You do not have permission to update this task." },
          { status: 403 }
        );
      }

      if (body.status === undefined) {
        return NextResponse.json(
          { error: "Only status can be updated." },
          { status: 400 }
        );
      }
      if (!ALLOWED_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      updates.status = body.status;
    } else {
      if (body.title !== undefined) {
        if (typeof body.title !== "string" || body.title.trim().length < 2) {
          return NextResponse.json(
            { error: "Task title must be at least 2 characters." },
            { status: 400 }
          );
        }
        updates.title = body.title.trim();
      }

      if (body.description !== undefined) {
        updates.description =
          typeof body.description === "string"
            ? body.description.trim()
            : undefined;
      }

      if (body.status !== undefined) {
        if (!ALLOWED_STATUSES.includes(body.status)) {
          return NextResponse.json(
            { error: "Invalid status." },
            { status: 400 }
          );
        }
        updates.status = body.status;
      }

      if (body.assignedTo !== undefined) {
        if (
          typeof body.assignedTo !== "string" ||
          !isValidObjectId(body.assignedTo)
        ) {
          return NextResponse.json(
            { error: "Invalid assignee." },
            { status: 400 }
          );
        }
        const assigneeExists = await db
          .collection("users")
          .findOne({ _id: new ObjectId(body.assignedTo) });
        if (!assigneeExists) {
          return NextResponse.json(
            { error: "Assignee not found." },
            { status: 404 }
          );
        }
        updates.assignedTo = new ObjectId(body.assignedTo);
      }

      if (body.dueDate !== undefined) {
        if (body.dueDate === null) {
          updates.dueDate = undefined;
        } else {
          const d = new Date(body.dueDate);
          if (isNaN(d.getTime())) {
            return NextResponse.json(
              { error: "Invalid due date." },
              { status: 400 }
            );
          }
          updates.dueDate = d;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided to update." },
        { status: 400 }
      );
    }

    updates.updatedAt = new Date();

    const result = await tasks.findOneAndUpdate(
      { _id: new ObjectId(taskId) },
      { $set: updates },
      { returnDocument: "after" }
    );

    await logAction({
      userId: user._id!,
      action: "task.updated",
      customerId: existingTask.customerId,
      targetId: new ObjectId(taskId),
      details: `Updated fields: ${Object.keys(updates)
        .filter((k) => k !== "updatedAt")
        .join(", ")}`,
    });

    return NextResponse.json(
      { message: "Task updated.", task: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Update task error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete tasks." },
        { status: 403 }
      );
    }

    const { taskId } = await params;
    if (!isValidObjectId(taskId)) {
      return NextResponse.json({ error: "Invalid task id." }, { status: 400 });
    }

    const db = await getDb();
    const tasks = db.collection<Task>("tasks");

    const taskToDelete = await tasks.findOne({ _id: new ObjectId(taskId) });

    const result = await tasks.deleteOne({ _id: new ObjectId(taskId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    await logAction({
      userId: user._id!,
      action: "task.deleted",
      targetId: new ObjectId(taskId),
      customerId: taskToDelete?.customerId,
    });

    return NextResponse.json({ message: "Task deleted." }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Delete task error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
