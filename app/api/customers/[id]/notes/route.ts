import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { requireAuth, requireRole, AuthError } from "@/lib/authGuard";
import { isOwnCustomerRecord } from "@/lib/customerAccess";
import { logAction } from "@/lib/auditLog";
import { Note } from "@/models/types";

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
    const { content, visibleToCustomer } = body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Note content is required." },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: "Note content must be under 5000 characters." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const customers = db.collection("customers");
    const customerExists = await customers.findOne({ _id: new ObjectId(id) });
    if (!customerExists) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const notes = db.collection<Note>("notes");
    const newNote: Note = {
      customerId: new ObjectId(id),
      authorId: admin._id!,
      content: content.trim(),
      visibleToCustomer: Boolean(visibleToCustomer),
      createdAt: new Date(),
    };

    const result = await notes.insertOne(newNote);

    await logAction({
      userId: admin._id!,
      action: "note.created",
      targetId: result.insertedId,
      details: `Added a note to customer ${customerExists.name || id}`,
    });

    return NextResponse.json(
      { message: "Note added.", note: { ...newNote, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("Create note error:", error);
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
          { error: "You do not have permission to view these notes." },
          { status: 403 }
        );
      }
    }

    const db = await getDb();
    const notes = db.collection<Note>("notes");

    const filter =
      user.role === "admin"
        ? { customerId }
        : { customerId, visibleToCustomer: true };

    const items = await notes.find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ notes: items }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    console.error("List notes error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
