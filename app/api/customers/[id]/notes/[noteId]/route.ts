import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireRole, AuthError } from "@/lib/authGuard";
import { Note } from "@/models/types";

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

type RouteParams = { params: Promise<{ id: string; noteId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["admin"]);

    const { noteId } = await params;
    if (!isValidObjectId(noteId)) {
      return NextResponse.json({ error: "Invalid note id." }, { status: 400 });
    }

    const body = await req.json();
    const updates: Partial<Note> = {};

    if (body.content !== undefined) {
      if (
        typeof body.content !== "string" ||
        body.content.trim().length === 0
      ) {
        return NextResponse.json(
          { error: "Note content cannot be empty." },
          { status: 400 }
        );
      }
      if (body.content.length > 5000) {
        return NextResponse.json(
          { error: "Note content must be under 5000 characters." },
          { status: 400 }
        );
      }
      updates.content = body.content.trim();
    }

    if (body.visibleToCustomer !== undefined) {
      updates.visibleToCustomer = Boolean(body.visibleToCustomer);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided to update." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const notes = db.collection<Note>("notes");

    const result = await notes.findOneAndUpdate(
      { _id: new ObjectId(noteId) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Note updated.", note: result },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Update note error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(["admin"]);

    const { noteId } = await params;
    if (!isValidObjectId(noteId)) {
      return NextResponse.json({ error: "Invalid note id." }, { status: 400 });
    }

    const db = await getDb();
    const notes = db.collection<Note>("notes");

    const result = await notes.deleteOne({ _id: new ObjectId(noteId) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted." }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
